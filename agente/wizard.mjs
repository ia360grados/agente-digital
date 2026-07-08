// ============================================================
//  Agente Digital — Asistente de configuración (Mac y Windows)
//  Preguntas sencillas → genera config.json y CLAUDE.md
// ============================================================
import { createInterface } from 'node:readline/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = async (pregunta, porDefecto = '') => {
  const sufijo = porDefecto ? ` [${porDefecto}]` : '';
  const r = (await rl.question(`${pregunta}${sufijo}: `)).trim();
  return r || porDefecto;
};

console.log('');
console.log('══════════════════════════════════════════════');
console.log('   🤖 CONFIGURA TU AGENTE — 6 preguntas');
console.log('══════════════════════════════════════════════');
console.log('');

const negocio = await ask('1/6 · Nombre de tu negocio');
const sector = await ask('2/6 · ¿A qué se dedica? (clínica, tienda, gestoría...)');
const nombreAgente = await ask('3/6 · Nombre para tu agente', `Asistente de ${negocio}`);
const horario = await ask('4/6 · Horario de atención', 'L-V 9:00-18:00');
const tono = await ask('5/6 · Tono (cercano / profesional / formal)', 'cercano');
console.log('');
console.log('6/6 · ¿Qué números de móvil pueden darle órdenes al agente?');
console.log('      (El tuyo y los de tu equipo. Con prefijo y sin espacios,');
console.log('       separados por comas. Ej: 34600111222,34600333444)');
const numeros = await ask('      Números autorizados');
rl.close();

// ---------- config.json ----------
const config = {
  negocio,
  sector,
  agente: nombreAgente,
  horario,
  tono,
  idioma: 'español',
  numeros_autorizados: numeros.split(',').map((n) => n.trim()).filter(Boolean),
};
writeFileSync(join(DIR, 'config.json'), JSON.stringify(config, null, 2));

// ---------- CLAUDE.md (personalidad del agente) ----------
const plantilla = readFileSync(join(DIR, 'CLAUDE.md.template'), 'utf8');
const claudeMd = plantilla
  .replaceAll('{{NEGOCIO}}', negocio)
  .replaceAll('{{SECTOR}}', sector)
  .replaceAll('{{AGENTE}}', nombreAgente)
  .replaceAll('{{HORARIO}}', horario)
  .replaceAll('{{TONO}}', tono)
  .replaceAll('{{IDIOMA}}', 'español');
writeFileSync(join(DIR, 'CLAUDE.md'), claudeMd);

console.log('');
console.log('✅ Configuración guardada.');
console.log('');
