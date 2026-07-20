#!/bin/bash
# ============================================================
#  Agente Digital — Auto-actualización con RED DE SEGURIDAD
#  Baja la última versión. Si la nueva versión está rota
#  (error de sintaxis o no arranca estable), vuelve sola a la
#  versión anterior. Un commit malo NUNCA deja al cliente tirado.
# ============================================================
DIR="$HOME/agente-digital"
LOG="$DIR/agente/actualizaciones.log"
PLIST="$HOME/Library/LaunchAgents/com.agentedigital.agente.plist"
log() { echo "[$(date '+%Y-%m-%d %H:%M')] $1" >> "$LOG"; }

cd "$DIR" 2>/dev/null || exit 0
command -v node >/dev/null 2>&1 || { [ -x /opt/homebrew/bin/node ] && export PATH="/opt/homebrew/bin:$PATH"; }

ANTES=$(git rev-parse HEAD 2>/dev/null)
git pull --ff-only >> "$LOG" 2>&1
DESPUES=$(git rev-parse HEAD 2>/dev/null)
[ "$ANTES" = "$DESPUES" ] && { log "Sin cambios."; exit 0; }
log "Nueva versión $ANTES → $DESPUES. Comprobando..."

rollback() {
  log "⛔ $1 — volviendo a la versión anterior ($ANTES)."
  git reset --hard "$ANTES" >> "$LOG" 2>&1
  (cd "$DIR/agente" && npm install --silent >> "$LOG" 2>&1)
  launchctl unload "$PLIST" 2>/dev/null; launchctl load "$PLIST" 2>/dev/null
  log "↩︎ Restaurado. El agente sigue con la versión estable."
  exit 1
}

# 1) Chequeo de sintaxis ANTES de tocar nada (atrapa el 90% de commits rotos)
for f in agente/lector.mjs agente/wizard.mjs agente/licencia.mjs; do
  node --check "$DIR/$f" 2>>"$LOG" || rollback "Sintaxis rota en $f"
done

# 2) Dependencias
(cd "$DIR/agente" && npm install --silent >> "$LOG" 2>&1) || rollback "npm install falló"

# 3) Reinicio
launchctl unload "$PLIST" 2>/dev/null; launchctl load "$PLIST" 2>/dev/null

# 4) Chequeo de estabilidad: debe seguir vivo y no en bucle de reinicio
sleep 25
PID1=$(pgrep -f "agente/lector.mjs" | head -1)
[ -z "$PID1" ] && rollback "El agente no arrancó"
sleep 12
PID2=$(pgrep -f "agente/lector.mjs" | head -1)
# Si el PID cambió, es que crasheó y launchd lo relanzó = inestable
[ "$PID1" != "$PID2" ] && rollback "El agente arranca y se cae (inestable)"

log "✅ Actualizado y estable (PID $PID2)."
