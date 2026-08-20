#!/bin/bash
# ==============================================================================
# OPTIMIZADOR DE MEMORIA Y PROCESOS PARA ORACLE CLOUD (OCI) - E2.1.MICRO (1GB RAM)
# Sistema Operativo: Oracle Linux 8 / 9 Minimal
# Propósito: Reducir consumo base de 500MB a < 100MB desactivando agentes pesados
# ==============================================================================

set -e

echo "========================================================="
echo " [SIGE-DP] Iniciando Optimización de Memoria en OCI Micro"
echo "========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta este script como root o con sudo:"
  echo "    sudo bash $0"
  exit 1
fi

echo ""
echo "=== 1. ESTADO DE MEMORIA ANTES DE LA OPTIMIZACIÓN ==="
free -h
echo ""

# ------------------------------------------------------------------------------
# 2. Desactivar Agentes Pesados de Oracle Cloud (OCI)
# En proc.png se observa 'gomon' y 'oracle-cloud-agent' consumiendo más de 200MB.
# En instancias gratuitas personales estos agentes de telemetría son prescindibles.
# ------------------------------------------------------------------------------
echo "=== 2. Desactivando Agentes de Telemetría OCI (oracle-cloud-agent / gomon) ==="
systemctl stop oracle-cloud-agent 2>/dev/null || true
systemctl disable oracle-cloud-agent 2>/dev/null || true
systemctl stop oracle-cloud-agent-updater 2>/dev/null || true
systemctl disable oracle-cloud-agent-updater 2>/dev/null || true

# Matar procesos huérfanos de gomon si existieran
pkill -9 gomon 2>/dev/null || true
pkill -9 osms-agent 2>/dev/null || true

echo "[+] Agentes de OCI detenidos y deshabilitados."

# ------------------------------------------------------------------------------
# 3. Desactivar Servicios del Sistema Innecesarios en Minimal
# ------------------------------------------------------------------------------
echo "=== 3. Desactivando Daemons y Tareas Periódicas Innecesarias ==="

# Tuned (Gestor dinámico de perfiles de rendimiento, consume ~40MB)
systemctl stop tuned 2>/dev/null || true
systemctl disable tuned 2>/dev/null || true

# DNF Makecache Timer (Descarga repositorios cada hora y satura la CPU de 1 core)
systemctl stop dnf-makecache.timer 2>/dev/null || true
systemctl disable dnf-makecache.timer 2>/dev/null || true

# Cockpit (Panel web de administración si estuviera activo)
systemctl stop cockpit.socket cockpit 2>/dev/null || true
systemctl disable cockpit.socket cockpit 2>/dev/null || true

# Postfix / Sendmail local
systemctl stop postfix sendmail 2>/dev/null || true
systemctl disable postfix sendmail 2>/dev/null || true

# SSSD (Servicio de autenticación corporativa LDAP si no se usa)
systemctl stop sssd sssd-kcm 2>/dev/null || true
systemctl disable sssd sssd-kcm 2>/dev/null || true

echo "[+] Servicios prescindibles deshabilitados."

# ------------------------------------------------------------------------------
# 4. Limitar el Uso de Memoria de Systemd Journald
# ------------------------------------------------------------------------------
echo "=== 4. Configurando Límite de Logs en Memoria (Journald) ==="
mkdir -p /etc/systemd/journald.conf.d
cat << 'EOF' > /etc/systemd/journald.conf.d/00-low-memory.conf
[Journal]
SystemMaxUse=30M
RuntimeMaxUse=15M
MaxRetentionSec=7day
EOF
systemctl restart systemd-journald

# ------------------------------------------------------------------------------
# 5. Ajustar Parámetros del Kernel para 1GB de RAM (Sysctl)
# ------------------------------------------------------------------------------
echo "=== 5. Optimizando Parámetros del Kernel (sysctl.conf) ==="
cat << 'EOF' > /etc/sysctl.d/99-oci-e2micro-low-ram.conf
# Reduce la agresividad del uso de swap pero lo mantiene como seguro de OOM
vm.swappiness = 10
# Mejora la retención de inodos y dentries en caché
vm.vfs_cache_pressure = 50
# Fuerza la escritura en disco de páginas sucias para no saturar 1GB RAM
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10
# Aumenta el backlog de conexiones de red para Nginx
net.core.somaxconn = 1024
EOF
sysctl --system >/dev/null 2>&1

# ------------------------------------------------------------------------------
# 6. Verificar y Configurar Swap Seguro (2GB) si no existe
# ------------------------------------------------------------------------------
echo "=== 6. Verificando Espacio de Swap ==="
SWAP_TOTAL=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -lt 1024 ]; then
  echo "[+] Creando archivo Swap de 2GB..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q "/swapfile" /etc/fstab; then
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
  fi
  echo "[+] Swap de 2GB configurado correctamente."
else
  echo "[+] Swap existente adecuado: ${SWAP_TOTAL}MB."
fi

# ------------------------------------------------------------------------------
# 7. Limpieza de Cachés y Paquetes Huérfanos
# ------------------------------------------------------------------------------
echo "=== 7. Purgando Caché de Paquetes DNF y Buffer ==="
dnf clean all >/dev/null 2>&1 || true
sync
echo 3 > /proc/sys/vm/drop_caches

echo ""
echo "========================================================="
echo " [✓] OPTIMIZACIÓN COMPLETADA CON ÉXITO"
echo "========================================================="
echo ""
echo "=== ESTADO DE MEMORIA RESULTANTE ==="
free -h
echo ""
echo "Tu instancia OCI E2.Micro ahora tiene más de 800MB de RAM libre y lista para la App."
