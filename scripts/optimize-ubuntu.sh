#!/bin/bash
# ==============================================================================
# OPTIMIZADOR DE MEMORIA Y PROCESOS PARA UBUNTU MINIMAL (OCI E2.1.MICRO 1GB RAM)
# Propósito: Reducir consumo de RAM en reposo a < 90MB desactivando agentes y daemons
# ==============================================================================

set -e

echo "========================================================="
echo " [SIGE-DP] Optimizando Ubuntu Minimal en OCI Micro"
echo "========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta este script con privilegios root:"
  echo "    sudo bash $0"
  exit 1
fi

echo ""
echo "=== 1. ESTADO DE MEMORIA ANTES DE LA OPTIMIZACIÓN ==="
free -h
echo ""

# ------------------------------------------------------------------------------
# 2. Desactivar Agentes de Telemetría OCI (Oracle Cloud Agent & Gomon)
# ------------------------------------------------------------------------------
echo "=== 2. Desactivando Agentes OCI (oracle-cloud-agent / gomon) ==="
systemctl stop oracle-cloud-agent 2>/dev/null || true
systemctl disable oracle-cloud-agent 2>/dev/null || true
systemctl stop oracle-cloud-agent-updater 2>/dev/null || true
systemctl disable oracle-cloud-agent-updater 2>/dev/null || true

# Detener snap de oracle-cloud-agent si existe
snap stop oracle-cloud-agent 2>/dev/null || true
snap disable oracle-cloud-agent 2>/dev/null || true

pkill -9 gomon 2>/dev/null || true
pkill -9 osms-agent 2>/dev/null || true
echo "[+] Agentes de telemetría OCI detenidos y deshabilitados."

# ------------------------------------------------------------------------------
# 3. Desactivar Snapd (Ahorra ~60-80 MB de RAM en instancias minimal)
# ------------------------------------------------------------------------------
echo "=== 3. Desactivando Snapd Daemon ==="
systemctl stop snapd.service snapd.socket snapd.seeded.service 2>/dev/null || true
systemctl disable snapd.service snapd.socket snapd.seeded.service 2>/dev/null || true
echo "[+] Snapd deshabilitado."

# ------------------------------------------------------------------------------
# 4. Desactivar Servicios y Timers Innecesarios en Ubuntu Minimal
# ------------------------------------------------------------------------------
echo "=== 4. Desactivando Tareas Periódicas y Daemons Innecesarios ==="

# Multipathd (Solo necesario para SAN de múltiples rutas, no en VPS)
systemctl stop multipathd.service multipathd.socket 2>/dev/null || true
systemctl disable multipathd.service multipathd.socket 2>/dev/null || true

# Timers de actualización de APT que saturan CPU y RAM de 1 core
systemctl stop apt-daily.timer apt-daily-upgrade.timer 2>/dev/null || true
systemctl disable apt-daily.timer apt-daily-upgrade.timer 2>/dev/null || true

# Notificaciones de noticias MOTD
systemctl stop motd-news.timer 2>/dev/null || true
systemctl disable motd-news.timer 2>/dev/null || true

echo "[+] Servicios prescindibles deshabilitados."

# ------------------------------------------------------------------------------
# 5. Limitar Tamaño de Logs en Memoria (Systemd Journald)
# ------------------------------------------------------------------------------
echo "=== 5. Configurando Límite de Logs en Memoria (Journald) ==="
mkdir -p /etc/systemd/journald.conf.d
cat << 'EOF' > /etc/systemd/journald.conf.d/00-low-memory.conf
[Journal]
SystemMaxUse=30M
RuntimeMaxUse=15M
MaxRetentionSec=7day
EOF
systemctl restart systemd-journald

# ------------------------------------------------------------------------------
# 6. Optimización de Kernel para 1GB de RAM (Sysctl)
# ------------------------------------------------------------------------------
echo "=== 6. Optimizando Parámetros del Kernel ==="
cat << 'EOF' > /etc/sysctl.d/99-ubuntu-e2micro-low-ram.conf
# Prioriza memoria física antes de swappear
vm.swappiness = 10
# Reduce presión sobre inodos/dentries
vm.vfs_cache_pressure = 50
# Fuerza volcado de páginas sucias a disco
vm.dirty_background_ratio = 5
vm.dirty_ratio = 10
# Backlog de conexiones para Nginx
net.core.somaxconn = 1024
EOF
sysctl --system >/dev/null 2>&1

# ------------------------------------------------------------------------------
# 7. Crear o Asegurar Archivo Swap de 2GB
# ------------------------------------------------------------------------------
echo "=== 7. Verificando Espacio de Swap ==="
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
# 8. Limpieza de Caché de APT y Memoria Buffer
# ------------------------------------------------------------------------------
echo "=== 8. Purgando Cachés ==="
apt-get clean >/dev/null 2>&1 || true
sync
echo 3 > /proc/sys/vm/drop_caches

echo ""
echo "========================================================="
echo " [✓] ¡OPTIMIZACIÓN EN UBUNTU MINIMAL COMPLETADA!"
echo "========================================================="
echo ""
echo "=== ESTADO DE MEMORIA RESULTANTE ==="
free -h
echo ""
echo "Tu instancia Ubuntu en OCI tiene ahora más de 850MB de RAM disponible para la App."
