#!/bin/bash
# Compatibilidad: el wizard real es multiplataforma (Node).
cd "$(dirname "$0")/agente" && exec node wizard.mjs
