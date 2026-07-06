#!/bin/bash
# ============================================================
#  Agente Digital — Instalador para macOS
#  Instala: Homebrew, Node, Claude Code, RustDesk, servicios
#  NO pide ni guarda ninguna credencial.
# ============================================================
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
step() { echo ""; echo "▶ $1"; }

echo "════════════════════════════════════════════"
echo "   AGENTE DIGITAL — Instalación"
echo "════════════════════════════════════════════"

# ---------- 1. Homebrew ----------
step "1/6 Homebrew"
if ! command -v brew >/dev/null 2>&1 && [ ! -x /opt/homebrew/bin/brew ] && [ ! -x /usr/local/bin/brew ]; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
# Cargar brew en esta sesión
if [ -x /opt/homebrew/bin/brew ]; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
if [ -x /usr/local/bin/brew ]; then eval "$(/usr/local/bin/brew shellenv)"; fi
echo "   Homebrew OK: $(brew --version | head -1)"

# ---------- 2. Node.js ----------
step "2/6 Node.js"
command -v node >/dev/null 2>&1 || brew install node
echo "   Node OK: $(node --version)"

# ---------- 3. Claude Code ----------
step "3/6 Claude Code"
command -v claude >/dev/null 2>&1 || npm install -g @anthropic-ai/claude-code
echo "   Claude Code OK: $(claude --version 2>/dev/null || echo instalado)"
echo "   ⚠ El CLIENTE debe iniciar sesión con SU cuenta: ejecutar 'claude' y seguir el login."

# ---------- 4. RustDesk (soporte remoto) ----------
step "4/6 RustDesk"
if [ ! -d /Applications/RustDesk.app ]; then
  brew install --cask rustdesk
fi
echo "   RustDesk OK. Recordar permisos: Accesibilidad + Grabación de pantalla."

# ---------- 5. Dependencias del agente ----------
step "5/6 Dependencias del puente WhatsApp"
cd "$DIR/agente" && npm install --silent
[ -f "$DIR/agente/.env" ] || cp "$DIR/agente/.env.example" "$DIR/agente/.env"
echo "   Dependencias OK. Credenciales pendientes (se rellenan en el wizard)."

# ---------- 6. Servicios: autoarranque + anti-suspensión ----------
step "6/6 Servicios (launchd)"
mkdir -p "$HOME/Library/LaunchAgents"
for plist in "$DIR"/launchd/*.plist; do
  name="$(basename "$plist")"
  sed "s|__DIR__|$DIR|g; s|__HOME__|$HOME|g" "$plist" > "$HOME/Library/LaunchAgents/$name"
  launchctl unload "$HOME/Library/LaunchAgents/$name" 2>/dev/null || true
  launchctl load "$HOME/Library/LaunchAgents/$name"
  echo "   Servicio cargado: $name"
done

# Evitar que el Mac se duerma (requiere admin; si falla, hacerlo a mano)
sudo pmset -a sleep 0 displaysleep 10 disksleep 0 2>/dev/null \
  && echo "   Anti-suspensión configurada (la pantalla sí se apaga)." \
  || echo "   ⚠ No se pudo configurar pmset (hacerlo en Ajustes > Batería/Energía)."

echo ""
echo "════════════════════════════════════════════"
echo " ✅ Instalación completada."
echo ""
echo " SIGUIENTES PASOS:"
echo "   1. El cliente inicia sesión en Claude:  claude"
echo "   2. Configurar el negocio:               ./wizard.sh"
echo "   3. Permisos de RustDesk en Ajustes > Privacidad y Seguridad"
echo "════════════════════════════════════════════"
