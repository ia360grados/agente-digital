// ============================================================
//  Agente Digital — Asistente de configuración (Mac y Windows)
//  Preguntas sencillas → genera config.json y CLAUDE.md
// ============================================================
import { createInterface } from 'node:readline/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activar } from './licencia.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = async (pregunta, porDefecto = '') => {
  const sufijo = porDefecto ? ` [${porDefecto}]` : '';
  const r = (await rl.question(`${pregunta}${sufijo}: `)).trim();
  return r || porDefecto;
};

console.log('');
console.log('══════════════════════════════════════════════');
console.log('   🔑 TU LICENCIA');
console.log('══════════════════════════════════════════════');
console.log('   La recibiste por email al comprar (AGD-XXXX-XXXX-XXXX).');
console.log('   Vale para UN ordenador y UN número de WhatsApp.');
console.log('');
let licenciaOk = false;
for (let intento = 1; intento <= 3 && !licenciaOk; intento++) {
  const clave = await ask('Tu clave de licencia');
  try {
    const res = await activar(clave);
    if (res.ok) {
      console.log(`✅ ${res.mensaje || 'Licencia activada'}`);
      licenciaOk = true;
    } else {
      console.log(`❌ ${res.error}`);
    }
  } catch {
    console.log('❌ No hay conexión a internet. Conéctate y vuelve a intentarlo.');
  }
}
if (!licenciaOk) {
  console.log('');
  console.log('No se pudo activar la licencia. Escríbenos: alberto.scale1@gmail.com');
  process.exit(1);
}

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

console.log('');
console.log('──────────────────────────────────────────────');
console.log('   🧰 LAS HERRAMIENTAS DE TU NEGOCIO');
console.log('   (para que tu agente las aprenda desde el día 1)');
console.log('──────────────────────────────────────────────');
console.log('');
const facturacion = await ask('¿Qué programa usáis para facturar/contabilidad?\n  (Holded, A3, ContaSol, Excel, ninguno...)', 'ninguno');
const herramientas = await ask('¿Qué otras herramientas usáis a diario?\n  (Google Calendar, Gmail, Drive, Excel...)', '');
const procesos = await ask('Cuéntale en 1-2 frases algo clave de cómo trabajáis\n  (opcional, ej: "las facturas se envían siempre el día 1")', '');
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
  facturacion,
  herramientas,
  procesos,
};
writeFileSync(join(DIR, 'config.json'), JSON.stringify(config, null, 2));

// ---------- CLAUDE.md (personalidad del agente) ----------
const plantilla = readFileSync(join(DIR, 'CLAUDE.md.template'), 'utf8');
let claudeMd = plantilla
  .replaceAll('{{NEGOCIO}}', negocio)
  .replaceAll('{{SECTOR}}', sector)
  .replaceAll('{{AGENTE}}', nombreAgente)
  .replaceAll('{{HORARIO}}', horario)
  .replaceAll('{{TONO}}', tono)
  .replaceAll('{{IDIOMA}}', 'español');

claudeMd += `
## Herramientas del negocio (aprendidas en la instalación)

- **Facturación/contabilidad**: ${facturacion || 'sin especificar'}
- **Otras herramientas del día a día**: ${herramientas || 'sin especificar'}
- **Notas de cómo trabajan**: ${procesos || 'sin notas'}

Ten SIEMPRE en cuenta estas herramientas al proponer o ejecutar tareas.
Si necesitas acceder a una de ellas y no sabes cómo, pregunta al usuario
cómo lo hace él (paso a paso) y APUNTA lo aprendido en este archivo, en
esta misma sección, para recordarlo para siempre.
`;
writeFileSync(join(DIR, 'CLAUDE.md'), claudeMd);

console.log('');
console.log('✅ Configuración guardada.');
console.log('');
