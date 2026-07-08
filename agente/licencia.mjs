// ============================================================
//  Agente Digital — Cliente de licencias
//  Una licencia = UN ordenador + UN número de WhatsApp.
//  Se activa en la instalación y se verifica a diario
//  (con 72h de gracia si no hay internet).
// ============================================================
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ARCHIVO = join(DIR, 'licencia.json');
const SERVIDOR = 'https://pmuapnoroxeurdhpdhjb.supabase.co/functions/v1/licencia';
const GRACIA_MS = 72 * 60 * 60 * 1000; // 72h sin internet

// ---------- Huella única del ordenador ----------
export function machineId() {
  try {
    if (process.platform === 'darwin') {
      const out = execSync(
        `ioreg -rd1 -c IOPlatformExpertDevice | awk -F'"' '/IOPlatformUUID/{print $4}'`,
        { encoding: 'utf8' }
      );
      return out.trim();
    }
    if (process.platform === 'win32') {
      const out = execSync(
        'reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid',
        { encoding: 'utf8' }
      );
      return (out.match(/MachineGuid\s+REG_SZ\s+(\S+)/) || [])[1] || '';
    }
  } catch {}
  return '';
}

// ---------- Llamada al servidor ----------
async function llamar(accion, clave, numero = '') {
  const r = await fetch(SERVIDOR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion, clave, machine_id: machineId(), numero }),
    signal: AbortSignal.timeout(15000),
  });
  return r.json();
}

const leer = () => (existsSync(ARCHIVO) ? JSON.parse(readFileSync(ARCHIVO, 'utf8')) : null);
const guardar = (d) => writeFileSync(ARCHIVO, JSON.stringify(d, null, 2));

// ---------- Activación (wizard, una vez) ----------
export async function activar(clave) {
  const res = await llamar('activar', clave);
  if (res.ok) guardar({ clave: clave.trim().toUpperCase(), ultima_ok: Date.now() });
  return res;
}

// ---------- Vincular el número del agente (al conectar WhatsApp) ----------
export async function vincularNumero(numero) {
  const lic = leer();
  if (!lic) return { ok: false, error: 'Sin licencia' };
  try {
    return await llamar('numero', lic.clave, numero);
  } catch {
    return { ok: true }; // sin internet: se reintentará en la verificación diaria
  }
}

// ---------- Verificación (arranque + diaria) ----------
export async function comprobar(numero = '') {
  const lic = leer();
  if (!lic) return { ok: false, error: 'Este agente no tiene licencia. Ejecuta el instalador.' };
  try {
    const res = await llamar('verificar', lic.clave, numero);
    if (res.ok) {
      lic.ultima_ok = Date.now();
      guardar(lic);
    }
    return res;
  } catch {
    // Sin internet o servidor caído: periodo de gracia
    if (Date.now() - (lic.ultima_ok || 0) < GRACIA_MS) return { ok: true, gracia: true };
    return { ok: false, error: 'No se pudo verificar la licencia (sin conexión demasiado tiempo).' };
  }
}
