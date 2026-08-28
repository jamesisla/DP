#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DESPLIEGUE ESTANDARIZADO — LEXAPP DP
# ==============================================================================
# Modos de uso:
#   1. Despliegue remoto desde tu PC local a OCI:
#      bash scripts/deploy.sh ubuntu@<IP_OCI> [amd64|arm64]
#
#   2. Despliegue local directo en el servidor OCI:
#      bash scripts/deploy.sh
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_HOST="${1:-}"
TARGET_ARCH="${2:-amd64}"

APP_NAME="lexapp-dp"
SERVICE_NAME="lexapp-dp"
REMOTE_DIR="/opt/apps/dp"

GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
NC="\033[0m"

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}🚀 Despliegue de LexApp DP${NC}"
echo -e "${CYAN}======================================================${NC}"

if [ -n "$TARGET_HOST" ]; then
  # ── MODO 1: DESPLIEGUE REMOTO VÍA SSH ───────────────────────────────────────
  echo -e "${BLUE}▶ Modo: Despliegue Remoto hacia ${TARGET_HOST}${NC}"
  echo -e "Arquitectura objetivo: ${YELLOW}linux/${TARGET_ARCH}${NC}"

  # 1. Compilar Frontend
  echo -e "\n${YELLOW}1. Compilando Frontend React...${NC}"
  (cd "$DIR/frontend" && npm install && npm run build)

  # 2. Compilar Binario Linux Go
  echo -e "\n${YELLOW}2. Compilando Binario Go nativo para Linux (${TARGET_ARCH})...${NC}"
  mkdir -p "$DIR/bin"
  (cd "$DIR" && CGO_ENABLED=0 GOOS=linux GOARCH="$TARGET_ARCH" go build -ldflags="-s -w" -o "bin/$APP_NAME" main.go)

  # 3. Transferir al servidor
  echo -e "\n${YELLOW}3. Transfiriendo binario y configuración a ${TARGET_HOST}:${REMOTE_DIR}...${NC}"
  ssh "$TARGET_HOST" "sudo mkdir -p $REMOTE_DIR/data $REMOTE_DIR/uploads && sudo chown -R \$USER:\$USER $REMOTE_DIR"
  rsync -avz "$DIR/bin/$APP_NAME" "$TARGET_HOST:$REMOTE_DIR/$APP_NAME"
  rsync -avz "$DIR/frontend/dist" "$TARGET_HOST:$REMOTE_DIR/frontend/"
  rsync -avz "$DIR/scripts/systemd/$SERVICE_NAME.service" "$TARGET_HOST:/tmp/$SERVICE_NAME.service"

  # 4. Configurar e Iniciar Systemd en Remoto
  echo -e "\n${YELLOW}4. Actualizando servicio systemd en el servidor...${NC}"
  ssh "$TARGET_HOST" "
    chmod +x $REMOTE_DIR/$APP_NAME
    sudo mv /tmp/$SERVICE_NAME.service /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME
    sudo systemctl restart $SERVICE_NAME
    sudo systemctl status $SERVICE_NAME --no-pager
  "
  echo -e "\n${GREEN}✅ Despliegue remoto de LexApp DP finalizado con éxito.${NC}"

else
  # ── MODO 2: DESPLIEGUE LOCAL EN EL SERVIDOR ─────────────────────────────────
  echo -e "${BLUE}▶ Modo: Despliegue Local en este servidor${NC}"
  bash "$DIR/scripts/build.sh"
  
  sudo mkdir -p "$REMOTE_DIR/data" "$REMOTE_DIR/uploads"
  sudo cp "$DIR/bin/$APP_NAME" "$REMOTE_DIR/$APP_NAME"
  sudo cp -r "$DIR/frontend/dist" "$REMOTE_DIR/frontend/"
  sudo cp "$DIR/scripts/systemd/$SERVICE_NAME.service" /etc/systemd/system/
  sudo chown -R "$USER":"$USER" "$REMOTE_DIR"
  sudo chmod +x "$REMOTE_DIR/$APP_NAME"
  
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl status "$SERVICE_NAME" --no-pager
  echo -e "\n${GREEN}✅ Despliegue local de LexApp DP finalizado.${NC}"
fi
