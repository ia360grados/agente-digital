#!/bin/bash
# ============================================================
#  AGENTE DIGITAL — Instalador para Mac (doble clic)
#  El cliente solo hace doble clic en este archivo y acepta.
#  Este archivo se descarga suelto desde la web de compra.
# ============================================================
set -e
clear
echo "══════════════════════════════════════════════════"
echo ""
echo "     🤖  AGENTE DIGITAL — Instalación automática"
echo ""
echo "  Esta ventana va a instalar tu empleado digital."
echo "  No tienes que hacer nada salvo:"
echo "   · escribir tu contraseña del Mac si te la pide"
echo "   · iniciar sesión en Claude cuando se abra el navegador"
echo "   · escanear un código QR con el móvil del agente"
echo ""
echo "  Duración: 15-25 minutos. NO cierres esta ventana."
echo ""
echo "══════════════════════════════════════════════════"
read -p "Pulsa INTRO para empezar..." _

REPO_URL="https://github.com/TU_USUARIO/agente-digital.git"
DEST="$HOME/agente-digital"
paso() { echo ""; echo "──────────────────────────────────────"; echo "▶ $1"; echo "──────────────────────────────────────"; }

# ---------- 1. Herramientas de Apple (git) ----------
if ! xcode-select -p >/dev/null 2>&1; then
  paso "macOS necesita instalar sus herramientas (una vez)"
  echo "Se abrirá una ventana: pulsa INSTALAR y espera a que termine."
  echo "Cuando acabe, vuelve a hacer DOBLE CLIC en este mismo archivo."
  xcode-select --install
  read -p "Pulsa INTRO para cerrar..." _
  exit 0
fi

# ---------- 2. Homebrew ----------
paso "1/7 · Preparando el gestor de programas (Homebrew)"
if ! command -v brew >/dev/null 2>&1 && [ ! -x /opt/homebrew/bin/brew ] && [ ! -x /usr/local/bin/brew ]; then
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
[ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
[ -x /usr/local/bin/brew ] && eval "$(/usr/local/bin/brew shellenv)"
echo "✓ Listo"

# ---------- 3. Node ----------
paso "2/7 · Instalando el motor (Node.js)"
command -v node >/dev/null 2>&1 || brew install node
echo "✓ Node $(node --version)"

# ---------- 4. Claude Code ----------
paso "3/7 · Instalando la inteligencia (Claude Code)"
command -v claude >/dev/null 2>&1 || npm install -g @anthropic-ai/claude-code
echo "✓ Claude Code instalado"

# ---------- 5. El agente ----------
paso "4/7 · Descargando tu Agente Digital"
if [ -d "$DEST/.git" ]; then git -C "$DEST" pull --ff-only; else git clone "$REPO_URL" "$DEST"; fi
cd "$DEST/agente" && npm install --silent
echo "✓ Agente descargado"

# ---------- 6. Login de Claude ----------
paso "5/7 · Conecta tu cuenta de Claude"
echo "Ahora se abrirá Claude. Sigue estos 2 pasos:"
echo "  1. Inicia sesión en el navegador con TU cuenta de Claude"
echo "  2. Cuando Claude te deje escribir, teclea  /exit  y pulsa INTRO"
read -p "Pulsa INTRO para abrir Claude..." _
claude || true
echo "✓ Cuenta conectada"

# ---------- 7. Configuración ----------
paso "6/7 · Configura tu negocio (6 preguntas)"
node wizard.mjs

# ---------- 8. Vincular WhatsApp por QR ----------
paso "7/7 · Conecta el WhatsApp del agente"
echo "Coge el MÓVIL DEL AGENTE (el del número nuevo, con WhatsApp ya activo)."
echo "En ese móvil: WhatsApp → Ajustes → Dispositivos vinculados → Vincular."
echo "Y escanea el código que va a aparecer aquí:"
read -p "Pulsa INTRO cuando tengas el móvil listo..." _
node lector.mjs --vincular

# ---------- 9. Autoarranque + anti-suspensión ----------
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$HOME/Library/LaunchAgents/com.agentedigital.agente.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.agentedigital.agente</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/env</string><string>node</string><string>$DEST/agente/lector.mjs</string>
  </array>
  <key>WorkingDirectory</key><string>$DEST/agente</string>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$DEST/agente/agente.log</string>
  <key>StandardErrorPath</key><string>$DEST/agente/agente.log</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict></plist>
EOF
cat > "$HOME/Library/LaunchAgents/com.agentedigital.antisueno.plist" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.agentedigital.antisueno</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/caffeinate</string><string>-s</string><string>-i</string>
  </array>
  <key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
</dict></plist>
EOF
launchctl unload "$HOME/Library/LaunchAgents/com.agentedigital.agente.plist" 2>/dev/null || true
launchctl load "$HOME/Library/LaunchAgents/com.agentedigital.agente.plist"
launchctl unload "$HOME/Library/LaunchAgents/com.agentedigital.antisueno.plist" 2>/dev/null || true
launchctl load "$HOME/Library/LaunchAgents/com.agentedigital.antisueno.plist"

echo ""
echo "══════════════════════════════════════════════════"
echo ""
echo "   🎉 ¡INSTALACIÓN COMPLETADA!"
echo ""
echo "   Tu agente ya está trabajando en segundo plano"
echo "   y arrancará solo aunque reinicies el Mac."
echo ""
echo "   PRUÉBALO: desde tu móvil personal, escribe por"
echo "   WhatsApp al número del agente:  Hola, ¿quién eres?"
echo ""
echo "══════════════════════════════════════════════════"
read -p "Pulsa INTRO para cerrar esta ventana..." _
