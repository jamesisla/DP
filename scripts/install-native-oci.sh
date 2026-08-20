#!/bin/bash
# ==============================================================================
# INSTALADOR NATIVO AUTOMATIZADO PARA SIGE-DP EN ORACLE LINUX MINIMAL (OCI)
# Diseñado para VM.Standard.E2.1.Micro (1GB RAM)
# ==============================================================================

set -e

echo "========================================================="
echo " [SIGE-DP] Despliegue Nativo Ultraligero en Oracle Linux"
echo "========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta este script con privilegios root:"
  echo "    sudo bash $0"
  exit 1
fi

PROJECT_DIR="/opt/sige-dp"
REPO_URL="https://github.com/jamesisla/DP.git"
APP_USER="opc"

# 1. Instalar dependencias esenciales del sistema
echo "=== 1. Instalando Paquetes Base (Python 3, Nginx, Git) ==="
dnf install -y oracle-epel-release-el8 2>/dev/null || dnf install -y epel-release 2>/dev/null || true
dnf install -y python39 python39-pip python39-devel nginx git tar gcc 2>/dev/null || \
dnf install -y python3 python3-pip python3-devel nginx git tar gcc

# 2. Instalar Node.js LTS para construir el frontend
if ! command -v node &> /dev/null; then
  echo "=== Instalando Node.js LTS para compilar el frontend ==="
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
fi

# 3. Descargar / Clonar Código Fuente
echo "=== 2. Preparando Directorio de Aplicación en $PROJECT_DIR ==="
mkdir -p "$PROJECT_DIR"
if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo "[+] Clonando repositorio desde GitHub..."
  git clone "$REPO_URL" "$PROJECT_DIR"
else
  echo "[+] Actualizando código existente desde Git..."
  cd "$PROJECT_DIR"
  git pull origin main
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

# Configurar variables de entorno .env si no existe
if [ ! -f ".env" ]; then
  cat << 'EOF' > .env
APP_NAME=SIGE-DP
ENVIRONMENT=production
SECRET_KEY=sige-dp-oci-ultra-secure-key-2026-prod
ACCESS_TOKEN_EXPIRE_MINUTES=480
# SQLite nativo con WAL: 0 MB de consumo extra de RAM
DATABASE_URL=sqlite:///./sql_app.db
CORS_ORIGINS=*
EOF
fi

# 5. Compilar Frontend (Vite -> Dist estático)
echo "=== 4. Compilando Frontend (Producción) ==="
cd "$PROJECT_DIR/frontend"
npm install --production=false
npm run build

# 6. Ajustar Permisos de Archivos
chown -R "$APP_USER:$APP_USER" "$PROJECT_DIR"

# 7. Configurar Servicio Systemd para Backend
echo "=== 5. Registrando Servicio Systemd (sige-dp.service) ==="
cp "$PROJECT_DIR/scripts/sige-dp.service" /etc/systemd/system/sige-dp.service
systemctl daemon-reload
systemctl enable --now sige-dp.service

# 8. Configurar Servidor Web Nginx
echo "=== 6. Configurando Servidor Nginx ==="
cp "$PROJECT_DIR/scripts/nginx-sige-dp.conf" /etc/nginx/conf.d/sige-dp.conf

# Desactivar server default de nginx si existe
sed -i 's/listen       80 default_server;/listen       8080 default_server;/g' /etc/nginx/nginx.conf 2>/dev/null || true

# Configurar SELinux para permitir que Nginx se conecte al puerto 8000
setsebool -P httpd_can_network_connect 1 2>/dev/null || true
# Permitir que Nginx lea los archivos en /opt/sige-dp
chcon -Rt httpd_sys_content_t "$PROJECT_DIR/frontend/dist" 2>/dev/null || true

systemctl enable --now nginx
systemctl reload nginx || systemctl restart nginx

# 9. Configuración de Firewall (Puertos 80 y 443)
echo "=== 7. Habilitando Puertos HTTP/HTTPS en Firewall ==="
if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-service=http 2>/dev/null || true
  firewall-cmd --permanent --add-service=https 2>/dev/null || true
  firewall-cmd --reload 2>/dev/null || true
fi

# Añadir regla en iptables nativo de OCI si aplica
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

echo ""
echo "========================================================="
echo " [✓] ¡DESPLIEGUE NATIVO COMPLETADO CON ÉXITO!"
echo "========================================================="
echo ""
echo "Estado de los servicios:"
systemctl is-active sige-dp.service && echo "  - Backend FastAPI: ACTIVO (127.0.0.1:8000)"
systemctl is-active nginx && echo "  - Frontend Nginx:  ACTIVO (Puerto 80)"
echo ""
echo "Acceso Web: http://$(curl -s ifconfig.me || echo 'TU_IP_PUBLICA_OCI')"
echo "Documentación API: http://$(curl -s ifconfig.me || echo 'TU_IP_PUBLICA_OCI')/docs"
