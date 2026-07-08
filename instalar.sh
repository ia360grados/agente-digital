#!/bin/bash
# ============================================================
#  Agente Digital — Instalador de UN comando
#  El cliente solo pega esto en la Terminal:
#    curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/agente-digital/main/instalar.sh | bash
#  Descarga el repo y ejecuta la instalación completa.
# ============================================================
set -e

REPO_URL="https://github.com/TU_USUARIO/agente-digital.git"
DEST="$HOME/agente-digital"

echo "════════════════════════════════════════════"
echo "   AGENTE DIGITAL — Instalación automática"
echo "════════════════════════════════════════════"

# git viene con las herramientas de línea de comandos de Apple
if ! xcode-select -p >/dev/null 2>&1; then
  echo ""
  echo "▶ macOS necesita instalar sus herramientas de desarrollo (una vez)."
  echo "  Se abrirá una ventana: pulsa INSTALAR y espera a que termine."
  echo "  Después, vuelve a pegar el mismo comando de instalación."
  xcode-select --install
  exit 0
fi

if [ -d "$DEST/.git" ]; then
  echo "▶ Ya existe una instalación: actualizando..."
  git -C "$DEST" pull --ff-only
else
  echo "▶ Descargando el Agente Digital..."
  git clone "$REPO_URL" "$DEST"
fi

cd "$DEST"
chmod +x install.sh wizard.sh
exec ./install.sh
