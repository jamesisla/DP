#!/bin/bash
# ==============================================================================
# SCRIPT DE ACTUALIZACIÓN RÁPIDA Y COMPILACIÓN DESDE GITHUB
# Ejecuta este script en el servidor para traer los últimos cambios de GitHub
# ==============================================================================

set -e

PROJECT_DIR="/opt/sige-dp"

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta con sudo: sudo bash $0"
  exit 1
fi

echo "=== 1. Obteniendo última versión de GitHub ==="
cd "$PROJECT_DIR"
git fetch origin
git reset --hard origin/main

echo "=== 2. Actualizando Backend (Python) ==="
cd "$PROJECT_DIR/backend"
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt

echo "=== 3. Compilando Frontend (React + Vite) ==="
cd "$PROJECT_DIR/frontend"
npm install --production=false
npm run build

echo "=== 4. Reiniciando Servicios ==="
systemctl restart sige-dp.service
systemctl reload nginx

echo ""
echo "[✓] ¡Actualización y compilación completada con éxito!"
echo "Estado: $(systemctl is-active sige-dp.service)"
