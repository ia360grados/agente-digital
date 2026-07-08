// ============================================================
//  Agente Digital — Lector de WhatsApp (vía QR, sin API de Meta)
//  Conecta como dispositivo vinculado (igual que WhatsApp Web),
//  escucha mensajes de los números autorizados y responde con
//  Claude Code como cerebro.
//
//  Modos:
//    node lector.mjs             → servicio normal (arranque automático)
//    node lector.mjs --vincular  → primera vez: muestra el QR y sale
//                                  cuando la sesión queda vinculada
// ============================================================
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { spawn } from 'node:child_process';
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comprobar, vincularNumero } from './licencia.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const MODO_VINCULAR = process.argv.includes('--vincular');
const LOG = join(DIR, 'agente.log');

const log = (msg) => {
  const linea = `[${new Date().toISOString()}] ${msg}\n`;
  try { appendFileSync(LOG, linea); } catch {}
  console.log(msg);
};

// ---------- Configuración (la escribe wizard.mjs) ----------
const CONFIG_PATH = join(DIR, 'config.json');
if (!existsSync(CONFIG_PATH)) {
  console.log('⚠ Falta config.json — ejecuta primero: node wizard.mjs');
  process.exit(1);
}
const CONFIG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const AUTORIZADOS = (CONFIG.numeros_autorizados || []).map((n) =>
  String(n).replace(/\D/g, '')
);

// ---------- Cerebro: Claude Code ----------
const CLAUDE = process.platform === 'win32' ? 'claude.cmd' : 'claude';
function cerebro(texto, remitente) {
  return new Promise((resolve) => {
    // El prompt entra por stdin (evita problemas de comillas en Windows)
    const p = spawn(CLAUDE, ['-p', '--max-turns', '15'], {
      cwd: DIR,
      shell: process.platform === 'win32',
      timeout: 5 * 60 * 1000,
      env: { ...process.env, REMITENTE: remitente },
    });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('error', () => resolve('Ahora mismo no puedo procesar tu petición. Inténtalo en unos minutos.'));
    p.on('close', (code) => {
      if (code !== 0) log(`cerebro devolvió código ${code}`);
      resolve(out.trim() || 'Hecho.');
    });
    p.stdin.write(texto);
    p.stdin.end();
  });
}

// ---------- Licencia: al arrancar y cada 24h ----------
let miNumero = '';
const licencia = await comprobar();
if (!licencia.ok) {
  log(`🔒 LICENCIA: ${licencia.error}`);
  process.exit(1);
}
setInterval(async () => {
  const l = await comprobar(miNumero);
  if (!l.ok) {
    log(`🔒 LICENCIA: ${l.error} — el agente se detiene.`);
    process.exit(1);
  }
}, 24 * 60 * 60 * 1000);

// ---------- Conexión WhatsApp ----------
let reintentos = 0;
async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState(join(DIR, 'auth'));
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    markOnlineOnConnect: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n══════════════════════════════════════════════');
      console.log('  📱 ESCANEA ESTE CÓDIGO CON EL MÓVIL DEL AGENTE');
      console.log('  WhatsApp → Ajustes → Dispositivos vinculados');
      console.log('  → Vincular un dispositivo');
      console.log('══════════════════════════════════════════════\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      reintentos = 0;
      log('✅ WhatsApp conectado. El agente está en su puesto.');
      // Casar el número del agente con la licencia
      miNumero = (sock.user?.id || '').split(':')[0].replace(/\D/g, '');
      if (miNumero) {
        vincularNumero(miNumero).then((r) => {
          if (!r.ok) {
            log(`🔒 LICENCIA: ${r.error} — el agente se detiene.`);
            process.exit(1);
          }
        });
      }
      if (MODO_VINCULAR) {
        console.log('\n🎉 ¡Vinculado! Ya puedes continuar con la instalación.');
        setTimeout(() => process.exit(0), 3000);
      }
    }
    if (connection === 'close') {
      const codigo = lastDisconnect?.error?.output?.statusCode;
      if (codigo === DisconnectReason.loggedOut) {
        log('❌ Sesión cerrada desde el móvil. Vuelve a vincular: node lector.mjs --vincular');
        process.exit(1);
      }
      const espera = Math.min(30000, 2000 * ++reintentos);
      log(`Conexión perdida (código ${codigo}). Reintento en ${espera / 1000}s...`);
      setTimeout(iniciar, espera);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || MODO_VINCULAR) return;
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue;
        const jid = m.key.remoteJid || '';
        if (!jid.endsWith('@s.whatsapp.net')) continue; // solo chats privados
        const numero = jid.split('@')[0].replace(/\D/g, '');
        const texto =
          m.message?.conversation ||
          m.message?.extendedTextMessage?.text ||
          '';
        if (!texto) continue;
        if (AUTORIZADOS.length && !AUTORIZADOS.includes(numero)) {
          log(`Mensaje ignorado de número no autorizado: ${numero}`);
          continue;
        }
        log(`💬 ${numero}: ${texto.slice(0, 120)}`);
        await sock.sendPresenceUpdate('composing', jid);
        const respuesta = await cerebro(texto, numero);
        await sock.sendMessage(jid, { text: respuesta.slice(0, 4000) });
        log(`→ Respondido a ${numero}`);
      } catch (err) {
        log(`ERROR procesando mensaje: ${err.message}`);
      }
    }
  });
}

iniciar();
