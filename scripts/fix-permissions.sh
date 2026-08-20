#!/bin/bash
# ==============================================================================
# DIAGNÓSTICO Y CORRECCIÓN DE PERMISOS, NGINX Y FIREWALL (UBUNTU OCI)
# ==============================================================================

set -e

echo "========================================================="
echo " [SIGE-DP] Verificación y Corrección Integral de Permisos"
echo "========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta este script con sudo:"
  echo "    sudo bash $0"
  exit 1
fi

PROJECT_DIR="/opt/sige-dp"
APP_USER="ubuntu"
if ! id "$APP_USER" &>/dev/null; then
  APP_USER=$(id -un 1000 2>/dev/null || echo "root")
fi

echo "=== 1. Corrigiendo Permisos de Directorios y Archivos ==="
# Asegurar permisos de lectura y paso para Nginx (www-data)
chmod 755 /opt
chmod 755 "$PROJECT_DIR"
chmod 755 "$PROJECT_DIR/frontend"
chmod -R 755 "$PROJECT_DIR/frontend/dist" 2>/dev/null || true

# Asegurar permisos de escritura para Backend (SQLite)
chown -R "$APP_USER:$APP_USER" "$PROJECT_DIR"
chmod -R 775 "$PROJECT_DIR/backend"

# Agregar www-data al grupo de la app si es necesario
usermod -aG "$APP_USER" www-data 2>/dev/null || true

echo "[+] Permisos de lectura (Nginx) y escritura (Backend) corregidos."

echo "=== 2. Verificando Reglas de Firewall e Iptables en OCI ==="
# Insertar regla al principio de la cadena INPUT para que nada la bloquee
iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

if command -v ufw &>/dev/null; then
  ufw allow 80/tcp 2>/dev/null || true
  ufw allow 443/tcp 2>/dev/null || true
fi

# Guardar reglas iptables si iptables-persistent está instalado
if command -v netfilter-persistent &>/dev/null; then
  netfilter-persistent save 2>/dev/null || true
fi
echo "[+] Puertos 80 y 443 asegurados en iptables."

echo "=== 3. Comprobando y Reiniciando Servicios ==="
systemctl restart sige-dp.service
systemctl restart nginx

sleep 2

echo ""
echo "=== 4. Test de Conexión Local ==="
echo -n "Backend FastAPI (127.0.0.1:8000/api/health): "
if curl -s http://127.0.0.1:8000/api/health | grep -q "status"; then
  echo "OK [✓]"
else
  echo "FALLÓ [X]"
  echo "--- Últimos logs del Backend ---"
  journalctl -u sige-dp.service -n 15 --no-pager
fi

echo -n "Frontend Nginx (127.0.0.1:80): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/)
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 304 ]; then
  echo "OK ($HTTP_CODE) [✓]"
else
  echo "RESPUESTA HTTP $HTTP_CODE [!]"
  echo "--- Últimos logs de error de Nginx ---"
  tail -n 15 /var/log/nginx/error.log 2>/dev/null || true
fi

echo ""
echo "========================================================="
echo " [✓] Diagnóstico finalizado."
echo " Si el navegador aún no responde desde el exterior, verifica"
echo " la regla Ingress (Puerto 80) en la consola web de Oracle Cloud."
echo "========================================================="
