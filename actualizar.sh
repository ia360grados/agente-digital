#!/bin/bash
# ============================================================
#  Agente Digital — Auto-actualización (se ejecuta cada noche)
#  Baja la última versión del repo, actualiza dependencias y
#  reinicia el agente. Si no hay cambios, no toca nada.
# ============================================================
DIR="$HOME/agente-digital"
LOG="$DIR/agente/actualizaciones.log"
log() { echo "[$(date '+%Y-%m-%d %H:%M')] $1" >> "$LOG"; }

cd "$DIR" || exit 0
ANTES=$(git rev-parse HEAD 2>/dev/null)
git pull --ff-only >> "$LOG" 2>&1
DESPUES=$(git rev-parse HEAD 2>/dev/null)

if [ "$ANTES" = "$DESPUES" ]; then
  log "Sin cambios."
  exit 0
fi

log "Actualizado $ANTES → $DESPUES. Instalando dependencias..."
cd "$DIR/agente" && npm install --silent >> "$LOG" 2>&1

# Reiniciar el agente para cargar la nueva versión
launchctl unload "$HOME/Library/LaunchAgents/com.agentedigital.agente.plist" 2>/dev/null
launchctl load "$HOME/Library/LaunchAgents/com.agentedigital.agente.plist" 2>/dev/null
log "Agente reiniciado con la nueva versión. ✓"
