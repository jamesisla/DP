#!/bin/bash
# ==============================================================================
# DESPLIEGUE NATIVO Y COMPILACIÓN DESDE GITHUB EN UBUNTU MINIMAL (OCI E2.1.MICRO)
# ==============================================================================

set -e

echo "========================================================="
echo " [SIGE-DP] Instalación Nativa y Compilación en Ubuntu OCI"
echo "========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta este script con privilegios root o sudo:"
  echo "    sudo bash $0"
  exit 1
fi

PROJECT_DIR="/opt/sige-dp"
REPO_URL="https://github.com/jamesisla/DP.git"
APP_USER="ubuntu"

# Si el usuario ubuntu no existe, usar el usuario no-root actual
if ! id "$APP_USER" &>/dev/null; then
  APP_USER=$(id -un 1000 2>/dev/null || echo "root")
fi

echo "[+] Usuario de ejecución configurado: $APP_USER"

# 1. Actualizar repositorios e instalar paquetes base
echo "=== 1. Instalando Paquetes Base (Python 3, Nginx, Git, Build-essential) ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y python3 python3-pip python3-venv python3-dev nginx git curl build-essential

# 2. Instalar Node.js 20 LTS para la compilación del Frontend
if ! command -v node &> /dev/null; then
  echo "=== Instalando Node.js 20 LTS ==="
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 3. Clonar o Actualizar Repositorio desde GitHub
echo "=== 2. Descargando / Actualizando Código desde GitHub en $PROJECT_DIR ==="
mkdir -p "$PROJECT_DIR"
if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "[+] Clonando repositorio desde $REPO_URL..."
  git clone "$REPO_URL" "$PROJECT_DIR"
else
  echo "[+] Repositorio existente. Obteniendo últimos cambios de Git..."
  cd "$PROJECT_DIR"
  git fetch origin
  git reset --hard origin/main
fi

# 4. Configurar Entorno Virtual de Python (Backend)
echo "=== 3. Configurando Backend en Entorno Virtual Python ==="
cd "$PROJECT_DIR/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip --no-cache-dir
pip install --no-cache-dir -r requirements.txt

# Crear archivo de variables de entorno si no existe
if [ ! -f ".env" ]; then
  cat << 'EOF' > .env
APP_NAME=SIGE-DP
ENVIRONMENT=production
SECRET_KEY=sige-dp-ubuntu-oci-key-2026-prod
ACCESS_TOKEN_EXPIRE_MINUTES=480
# SQLite con WAL: Ultra rápido y 0 MB de consumo extra de memoria
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=*
EOF
fi

# 5. Compilar Frontend (React + Vite -> HTML/JS estático)
echo "=== 4. Compilando Frontend (React + Vite) ==="
cd "$PROJECT_DIR/frontend"
npm install --production=false
npm run build

# 6. Asignar Permisos al Directorio
chown -R "$APP_USER:$APP_USER" "$PROJECT_DIR"

# 7. Configurar Servicio Systemd para Backend
echo "=== 5. Registrando Servicio Systemd (sige-dp.service) ==="
cat << EOF > /etc/systemd/system/sige-dp.service
[Unit]
Description=SIGE-DP Backend Service (FastAPI Ley 21.719)
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$PROJECT_DIR/backend
Environment="PATH=$PROJECT_DIR/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$PROJECT_DIR/backend/.env
ExecStart=$PROJECT_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1 --limit-concurrency 50

Restart=always
RestartSec=5s

MemoryMax=300M
MemoryHigh=250M

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now sige-dp.service
systemctl restart sige-dp.service

# 8. Configurar Servidor Web Nginx
echo "=== 6. Configurando Servidor Nginx ==="
cp "$PROJECT_DIR/scripts/nginx-sige-dp.conf" /etc/nginx/sites-available/sige-dp

# Habilitar sitio en Nginx y deshabilitar default
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/sige-dp /etc/nginx/sites-enabled/sige-dp

nginx -t
systemctl enable --now nginx
systemctl reload nginx || systemctl restart nginx

# 9. Configuración de Firewall (Puertos 80 y 443)
echo "=== 7. Habilitando Puertos HTTP/HTTPS en Firewall ==="
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

# Reglas iptables en OCI
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

echo ""
echo "========================================================="
echo " [✓] ¡DESPLIEGUE NATIVO EN UBUNTU COMPLETADO CON ÉXITO!"
echo "========================================================="
echo ""
echo "Estado de los servicios:"
systemctl is-active sige-dp.service && echo "  - Backend FastAPI: ACTIVO (127.0.0.1:8000)"
systemctl is-active nginx && echo "  - Frontend Nginx:  ACTIVO (Puerto 80)"
echo ""
echo "Acceso Web: http://$(curl -s ifconfig.me || echo 'TU_IP_PUBLICA_OCI')"
echo "Documentación API: http://$(curl -s ifconfig.me || echo 'TU_IP_PUBLICA_OCI')/docs"
