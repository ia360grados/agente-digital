// ============================================================
//  Agente Digital — Puente WhatsApp <-> Claude Code
//  WhatsApp Cloud API oficial (webhook) -> claude -p -> respuesta
//  Sin credenciales en el código: todo viene de .env
// ============================================================
require('dotenv').config();
const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_ID,
  WHATSAPP_VERIFY_TOKEN,
  NUMEROS_AUTORIZADOS = '',
  PUERTO = 3000,
} = process.env;

const AUTORIZADOS = NUMEROS_AUTORIZADOS.split(',').map(n => n.trim()).filter(Boolean);
const LOG = path.join(__dirname, 'agente.log');
const log = (msg) => {
  const linea = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG, linea);
  console.log(linea.trim());
};

const app = express();
app.use(express.json());

// ---------- Verificación del webhook (Meta lo llama una vez) ----------
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    log('Webhook verificado por Meta');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ---------- Mensajes entrantes ----------
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responder rápido a Meta, procesar después
  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== 'text') return;

    const de = msg.from;
    const texto = msg.text.body;

    if (AUTORIZADOS.length && !AUTORIZADOS.includes(de)) {
      log(`Mensaje RECHAZADO de número no autorizado: ${de}`);
      return;
    }

    log(`Mensaje de ${de}: ${texto}`);
    const respuesta = await preguntarAClaude(texto, de);
    await enviarWhatsApp(de, respuesta);
    log(`Respuesta enviada a ${de}`);
  } catch (err) {
    log(`ERROR procesando mensaje: ${err.message}`);
  }
});

// ---------- Claude Code como cerebro ----------
function preguntarAClaude(texto, remitente) {
  return new Promise((resolve) => {
    // claude -p usa el CLAUDE.md de este directorio como instrucciones
    // y las skills instaladas en ../skills
    execFile('claude', ['-p', texto, '--max-turns', '15'], {
      cwd: __dirname,
      timeout: 5 * 60 * 1000,
      env: { ...process.env, REMITENTE: remitente },
    }, (err, stdout) => {
      if (err) {
        log(`ERROR de Claude: ${err.message}`);
        return resolve('Ahora mismo no puedo procesar tu petición. Inténtalo en unos minutos.');
      }
      resolve(stdout.trim() || 'Hecho.');
    });
  });
}

// ---------- Enviar respuesta por la Cloud API ----------
async function enviarWhatsApp(a, texto) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: a,
      type: 'text',
      text: { body: texto.slice(0, 4000) },
    }),
  });
  if (!r.ok) log(`ERROR enviando WhatsApp: ${r.status} ${await r.text()}`);
}

app.listen(PUERTO, () => log(`Agente escuchando en puerto ${PUERTO}`));
