// ============================================================
//  Agente Digital — Lector de WhatsApp (vía QR, sin API de Meta)
//  Conecta como dispositivo vinculado (igual que WhatsApp Web),
//  escucha mensajes de los números autorizados y responde con
//  Claude Code como cerebro.
//
//  ROBUSTEZ:
//  · Reintento de mensajes (getMessage) — evita "mensajes sin descifrar".
//  · Reconexión automática con backoff.
//  · Captura de errores no controlados (el agente no se cae).
//  · Detección de sesión de Claude caducada + aviso al dueño por WhatsApp.
//
//  Modos:
//    node lector.mjs             → servicio normal (arranque automático)
//    node lector.mjs --vincular  → muestra el QR y sale al vincular
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

// El agente nunca debe morir por un error suelto.
process.on('uncaughtException', (e) => log(`uncaught: ${e?.stack || e?.message || e}`));
process.on('unhandledRejection', (e) => log(`rejection: ${e?.message || e}`));

// ---------- Configuración (la escribe wizard.mjs) ----------
const CONFIG_PATH = join(DIR, 'config.json');
if (!existsSync(CONFIG_PATH) && !MODO_VINCULAR) {
  console.log('⚠ Falta config.json — ejecuta primero: node wizard.mjs');
  process.exit(1);
}
const CONFIG = existsSync(CONFIG_PATH)
  ? JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
  : { numeros_autorizados: [] };
const AUTORIZADOS = (CONFIG.numeros_autorizados || []).map((n) =>
  String(n).replace(/\D/g, '')
);

// ---------- Cerebro: Claude Code ----------
const CLAUDE = process.platform === 'win32' ? 'claude.cmd' : 'claude';
// Detecta si el fallo es porque la sesión de Claude caducó (necesita re-login).
const ES_SESION_CADUCADA = (txt) =>
  /log ?in|not logged in|unauthorized|authenticat|invalid api key|sign ?in|expired|credential/i.test(txt || '');

let sesionClaudeAvisada = false; // para no spamear el aviso

function cerebro(texto, remitente) {
  return new Promise((resolve) => {
    let out = '', err = '';
    let p;
    try {
      p = spawn(CLAUDE, ['-p', '--max-turns', '15'], {
        cwd: DIR,
        shell: process.platform === 'win32',
        timeout: 5 * 60 * 1000,
        env: { ...process.env, REMITENTE: remitente },
      });
    } catch (e) {
      log(`no se pudo lanzar Claude: ${e.message}`);
      return resolve({ texto: 'Ahora mismo no puedo procesar tu petición.', sesionCaducada: /ENOENT/.test(e.message) });
    }
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => {
      log(`error de Claude: ${e.message}`);
      resolve({ texto: 'Ahora mismo no puedo procesar tu petición.', sesionCaducada: /ENOENT/.test(e.message) });
    });
    p.on('close', (code) => {
      if (code !== 0) log(`cerebro código ${code}: ${err.slice(0, 200)}`);
      const caducada = code !== 0 && ES_SESION_CADUCADA(err + out);
      resolve({ texto: out.trim() || 'Hecho.', sesionCaducada: caducada });
    });
    try { p.stdin.write(texto); p.stdin.end(); } catch {}
  });
}

// ---------- Licencia: al arrancar y cada 24h ----------
let miNumero = '';
if (!MODO_VINCULAR) {
  const licencia = await comprobar();
  if (!licencia.ok) {
    log(`🔒 LICENCIA: ${licencia.error}`);
    process.exit(1);
  }
  setInterval(async () => {
    try {
      const l = await comprobar(miNumero);
      if (!l.ok) {
        log(`🔒 LICENCIA: ${l.error} — el agente se detiene.`);
        process.exit(1);
      }
    } catch (e) { log(`chequeo licencia falló (se reintenta): ${e.message}`); }
  }, 24 * 60 * 60 * 1000);
}

// ---------- Almacén de mensajes (reintentos = robustez) ----------
const msgStore = new Map();
function recordar(id, message) {
  if (!id || !message) return;
  msgStore.set(id, message);
  if (msgStore.size > 3000) msgStore.delete(msgStore.keys().next().value);
}

// ---------- Conexión WhatsApp ----------
let reintentos = 0;
let sockRef = null;

async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState(join(DIR, 'auth'));
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    markOnlineOnConnect: true,
    getMessage: async (key) => msgStore.get(key.id) || undefined,
  });
  sockRef = sock;

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
      miNumero = (sock.user?.id || '').split(':')[0].replace(/\D/g, '');
      if (miNumero && !MODO_VINCULAR) {
        vincularNumero(miNumero).then((r) => {
          if (!r.ok) {
            log(`🔒 LICENCIA: ${r.error} — el agente se detiene.`);
            process.exit(1);
          }
        }).catch((e) => log(`vincularNumero falló (se reintenta luego): ${e.message}`));
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
        recordar(m.key?.id, m.message);
        if (m.key.fromMe) continue;
        const jid = m.key.remoteJid || '';
        if (!jid.endsWith('@s.whatsapp.net')) continue;
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
        await sock.sendPresenceUpdate('composing', jid).catch(() => {});
        const { texto: respuesta, sesionCaducada } = await cerebro(texto, numero);

        if (sesionCaducada) {
          log('🔑 Sesión de Claude caducada — avisando al dueño.');
          const aviso =
            '⚠️ Mi conexión con la inteligencia (Claude) ha caducado. ' +
            'Para reactivarme, en el ordenador donde vivo abre la Terminal y escribe:  claude  ' +
            '— inicia sesión y listo. (Es un minuto y se hace una sola vez.)';
          await sock.sendMessage(jid, { text: aviso }).catch(() => {});
          continue;
        }

        const res = await sock.sendMessage(jid, { text: respuesta.slice(0, 4000) });
        recordar(res?.key?.id, res?.message);
        log(`→ Respondido a ${numero}`);
      } catch (err) {
        log(`ERROR procesando mensaje: ${err.message}`);
      }
    }
  });
}

iniciar().catch((e) => {
  log(`Error al iniciar (reintento en 5s): ${e.message}`);
  setTimeout(iniciar, 5000);
});
