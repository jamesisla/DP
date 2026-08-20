#!/bin/bash
# ==============================================================================
# SCRIPT DE ACTUALIZACIÓN RÁPIDA Y COMPILACIÓN DESDE GITHUB
# Ejecuta este script en el servidor para traer los últimos cambios de GitHub
# ==============================================================================

set -e

PROJECT_DIR="/opt/sige-dp"
APP_USER="ubuntu"
if ! id "$APP_USER" &>/dev/null; then
  APP_USER=$(id -un 1000 2>/dev/null || echo "root")
fi

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

echo "=== 4. Ajustando Permisos (Nginx & SQLite) ==="
chmod 755 /opt
chmod 755 "$PROJECT_DIR"
chmod 755 "$PROJECT_DIR/frontend"
chmod -R 755 "$PROJECT_DIR/frontend/dist" 2>/dev/null || true
chown -R "$APP_USER:$APP_USER" "$PROJECT_DIR"
chmod -R 775 "$PROJECT_DIR/backend"
usermod -aG "$APP_USER" www-data 2>/dev/null || true

echo "=== 5. Reiniciando Servicios ==="
systemctl restart sige-dp.service
systemctl reload nginx || systemctl restart nginx

echo ""
echo "[✓] ¡Actualización y permisos completados con éxito!"
echo "Backend: $(systemctl is-active sige-dp.service)"
echo "Nginx:   $(systemctl is-active nginx)"
