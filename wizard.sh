#!/bin/bash
# ============================================================
#  Agente Digital — Wizard de configuración
#  Se ejecuta CON el cliente. Genera:
#    - agente/.env          (credenciales, solo en esta máquina)
#    - agente/CLAUDE.md     (personalidad e instrucciones del agente)
# ============================================================
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ENV="$DIR/agente/.env"

ask() { # ask "Pregunta" VARIABLE "valor por defecto"
  local q="$1" var="$2" def="$3" val
  if [ -n "$def" ]; then read -r -p "$q [$def]: " val; val="${val:-$def}";
  else read -r -p "$q: " val; fi
  eval "$var=\"\$val\""
}

echo "════════════════════════════════════════════"
echo "   AGENTE DIGITAL — Configuración del negocio"
echo "════════════════════════════════════════════"
echo ""

# ---------- Datos del negocio ----------
ask "Nombre del negocio" NEGOCIO ""
ask "Sector (clínica, gestoría, inmobiliaria...)" SECTOR ""
ask "Nombre del agente (cómo se presenta)" AGENTE "Asistente de $NEGOCIO"
ask "Horario de atención" HORARIO "L-V 9:00-18:00"
ask "Tono (cercano / profesional / formal)" TONO "cercano"
ask "Idioma principal" IDIOMA "español"

# ---------- WhatsApp Cloud API ----------
echo ""
echo "── Credenciales de WhatsApp Cloud API (Meta) ──"
echo "   (Se guardan SOLO en este ordenador, en agente/.env)"
ask "WHATSAPP_TOKEN (token permanente de Meta)" WA_TOKEN ""
ask "WHATSAPP_PHONE_ID (ID del número)" WA_PHONE_ID ""
ask "WHATSAPP_VERIFY_TOKEN (invéntalo, para el webhook)" WA_VERIFY "$(openssl rand -hex 8)"
ask "Números autorizados (con prefijo, separados por comas)" WA_ALLOWED ""

# ---------- Escribir .env ----------
cat > "$ENV" <<EOF
# Generado por wizard.sh — NO subir a git
WHATSAPP_TOKEN=$WA_TOKEN
WHATSAPP_PHONE_ID=$WA_PHONE_ID
WHATSAPP_VERIFY_TOKEN=$WA_VERIFY
NUMEROS_AUTORIZADOS=$WA_ALLOWED
PUERTO=3000
EOF
chmod 600 "$ENV"
echo "✔ Credenciales guardadas en agente/.env (permisos 600)"

# ---------- Generar CLAUDE.md ----------
sed -e "s|{{NEGOCIO}}|$NEGOCIO|g" \
    -e "s|{{SECTOR}}|$SECTOR|g" \
    -e "s|{{AGENTE}}|$AGENTE|g" \
    -e "s|{{HORARIO}}|$HORARIO|g" \
    -e "s|{{TONO}}|$TONO|g" \
    -e "s|{{IDIOMA}}|$IDIOMA|g" \
    "$DIR/agente/CLAUDE.md.template" > "$DIR/agente/CLAUDE.md"
echo "✔ Personalidad del agente generada en agente/CLAUDE.md"

# ---------- Reiniciar servicio ----------
launchctl unload "$HOME/Library/LaunchAgents/com.agentedigital.puente.plist" 2>/dev/null || true
launchctl load "$HOME/Library/LaunchAgents/com.agentedigital.puente.plist" 2>/dev/null || true

echo ""
echo "════════════════════════════════════════════"
echo " ✅ Agente configurado para: $NEGOCIO"
echo ""
echo " PRUEBA: envía un WhatsApp al número del negocio."
echo " Logs:   tail -f $DIR/agente/agente.log"
echo "════════════════════════════════════════════"
