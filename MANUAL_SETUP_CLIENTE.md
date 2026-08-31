# 🚀 MANUAL DE INSTALACIÓN, SETUP Y PUESTA EN MARCHA EN CLIENTE
## LEXAPP GRC HUB · PLATAFORMA DE CUMPLIMIENTO REGULATORIO DUAL (LEY N° 21.719 & LEY N° 21.663 ANCI)

---

> **Destinatarios:** Administradores de Sistemas (SysAdmin), Ingenieros DevOps, Oficiales de Seguridad (CISO) y Equipos de Infraestructura TI.  
> **Versión de la Guía:** 2.0 (Producción)  
> **Sistema Operativo Recomendado:** Ubuntu Server 22.04 LTS o 24.04 LTS (x86_64 o ARM64 / OCI Ampere).  
> **Ruta Estándar de Instalación:** `/opt/sige-dp/`  

---

## 📑 ÍNDICE DE CONTENIDOS

1. [REQUISITOS PREVIOS & MATRIZ DE DIMENSIONAMIENTO](#1-requisitos-previos--matriz-de-dimensionamiento)
2. [PASO 1: INSTALACIÓN DE DEPENDENCIAS BASE DEL SISTEMA](#paso-1-instalación-de-dependencias-base-del-sistema)
3. [PASO 2: DESPLIEGUE DEL CÓDIGO Y ESTRUCTURA EN `/opt/sige-dp/`](#paso-2-despliegue-del-código-y-estructura-en-optsige-dp)
4. [PASO 3: CONFIGURACIÓN DE VARIABLES DE ENTORNO (`.env`)](#paso-3-configuración-de-variables-de-entorno-env)
5. [PASO 4: CREACIÓN Y ACTIVACIÓN DEL SERVICIO SYSTEMD](#paso-4-creación-y-activación-del-servicio-systemd)
6. [PASO 5: CONFIGURACIÓN DE NGINX Y CERTIFICADO SSL (HTTPS)](#paso-5-configuración-de-nginx-y-certificado-ssl-https)
7. [PASO 6: CONFIGURACIÓN DE INTEGRACIONES OPEN SOURCE TÉCNICAS](#paso-6-configuración-de-integraciones-open-source-técnicas)
   * 6.1. Conexión de Wazuh SIEM / XDR (Alertas 3h ANCI & 72h DPO)
   * 6.2. Conexión de Respaldos Inmutables WORM (MinIO / Restic)
   * 6.3. Conexión de Microsoft Presidio NLP (Auditoría de PII)
8. [PASO 7: SCRIPT DE ACTUALIZACIÓN AUTOMATIZADA (`./update.sh`)](#paso-7-script-de-actualización-automatizada-updatesh)
9. [PASO 8: CHECKLIST DE VALIDACIÓN Y SMOKE TEST](#paso-8-checklist-de-validación-y-smoke-test)
10. [RESOLUCIÓN DE PROBLEMAS FRECUENTES (TROUBLESHOOTING)](#10-resolución-de-problemas-frecuentes-troubleshooting)

---

## 1. REQUISITOS PREVIOS & MATRIZ DE DIMENSIONAMIENTO

### 📊 Tabla de Recursos de Servidor

| Escenario de Despliegue | vCPU | Memoria RAM | Disco SSD | Uso Recomendado |
| :--- | :---: | :---: | :---: | :--- |
| **Modo Core (LexApp GRC Hub)** | 1 a 2 vCPU | 1 GB a 2 GB | 20 GB | Instancia dedicada en OCI Always Free o VM ligera institucional. |
| **Modo Stack Completo (LexApp + Wazuh + MinIO)** | 4 vCPU | 8 GB a 16 GB | 100 GB+ | Servidor todo-en-uno para organismos medianos. |

### 🔒 Reglas de Red y Puertos de Firewall

| Puerto | Protocolo | Origen | Propósito |
| :---: | :---: | :---: | :--- |
| **22** | TCP | Red de Administración / VPN | Acceso SSH seguro. |
| **80** | TCP | Público / Red Institucional | Redirección obligatoria a HTTPS. |
| **443** | TCP | Público / Red Institucional | Acceso Web seguro (Frontend y Portal Ciudadano). |
| **8000** | TCP | `127.0.0.1` (Localhost) | API Backend (Protegido detrás de Nginx, **nunca público**). |

---

## PASO 1: INSTALACIÓN DE DEPENDENCIAS BASE DEL SISTEMA

Conéctese al servidor por SSH y ejecute la instalación de los paquetes necesarios:

```bash
# 1. Actualizar repositorios
sudo apt update && sudo apt upgrade -y

# 2. Instalar paquetes esenciales
sudo apt install -y \
  python3 python3-pip python3-venv \
  nodejs npm nginx sqlite3 git curl jq ufw certbot python3-certbot-nginx

# 3. Verificar versiones instaladas
python3 --version   # Requiere Python 3.10+
node --version      # Requiere Node.js 18+ o 20+
nginx -v
```

---

## PASO 2: DESPLIEGUE DEL CÓDIGO Y ESTRUCTURA EN `/opt/sige-dp/`

```bash
# 1. Crear el directorio institucional y asignar permisos
sudo mkdir -p /opt/sige-dp
sudo chown -R $USER:$USER /opt/sige-dp

# 2. Clonar el repositorio oficial
git clone https://github.com/jamesisla/DP.git /opt/sige-dp
cd /opt/sige-dp

# 3. Configurar el Entorno Virtual de Python y dependencias
cd /opt/sige-dp/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# 4. Compilar el Frontend React de Producción
cd /opt/sige-dp/frontend
npm install
npm run build
```
*(El frontend compilado se generará en `/opt/sige-dp/frontend/dist`).*

---

## PASO 3: CONFIGURACIÓN DE VARIABLES DE ENTORNO (`.env`)

Cree el archivo de configuración en el backend:

```bash
cat << 'EOF' > /opt/sige-dp/backend/.env
# ==============================================================================
# CONFIGURACIÓN GENERAL DE PRODUCCIÓN - LEXAPP GRC HUB
# ==============================================================================
ENVIRONMENT="production"
PORT=8000
HOST="127.0.0.1"

# --- SEGURIDAD CRIPTOGRÁFICA Y JWT ---
# Generar una clave segura ejecutando en consola: openssl rand -hex 32
SECRET_KEY="REEMPLAZAR_POR_STRING_ALEATORIO_GENERADO_CON_OPENSSL"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=480

# --- API KEY DE SERVICIO PARA INTEGRACIONES OPEN SOURCE (WAZUH / MINIO / NLP) ---
LEXAPP_SERVICE_KEY="LEXAPP_SECRET_API_KEY_2026_INTEGRATION"

# --- BASE DE DATOS TRANSACCIONAL (SQLITE WAL DE ALTO RENDIMIENTO) ---
DATABASE_URL="sqlite:///./dp.db"

# --- CONFIGURACIÓN DE LOGS Y AUDITORÍA ---
LOG_LEVEL="INFO"
EOF
```

Genere una clave secreta segura y reemplace el valor de `SECRET_KEY`:
```bash
# Generar clave aleatoria de 64 caracteres hexadecimales:
openssl rand -hex 32
```

---

## PASO 4: CREACIÓN Y ACTIVACIÓN DEL SERVICIO SYSTEMD

Para que el backend se ejecute permanentemente y se recupere automáticamente ante fallos o reinicios del servidor:

```bash
sudo bash -c 'cat << EOF > /etc/systemd/system/sige-dp.service
[Unit]
Description=LexApp GRC Hub - Backend API Service
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/sige-dp/backend
ExecStart=/opt/sige-dp/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
EnvironmentFile=/opt/sige-dp/backend/.env

# Limite de descriptores de archivos para alta concurrencia
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF'
```

Activar y arrancar el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sige-dp
sudo systemctl start sige-dp

# Verificar que esté corriendo sin errores:
sudo systemctl status sige-dp --no-pager
```

---

## PASO 5: CONFIGURACIÓN DE NGINX Y CERTIFICADO SSL (HTTPS)

### 1. Configurar el bloque de Nginx
Reemplace `sige.tu-organismo.gob.cl` por el nombre de dominio o IP de su servidor:

```bash
sudo bash -c 'cat << EOF > /etc/nginx/sites-available/sige-dp
server {
    listen 80;
    server_name sige.tu-organismo.gob.cl;

    # Directorio de distribución estática del Frontend React
    root /opt/sige-dp/frontend/dist;
    index index.html;

    # Compresión Gzip para alto rendimiento
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Enrutamiento SPA (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy inverso seguro hacia la API Backend de FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # Cabeceras de Seguridad Obligatorias
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
EOF'
```

### 2. Habilitar el sitio y verificar Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/sige-dp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Instalar Certificado SSL Gratuito Let's Encrypt (Opcional si tiene dominio)
```bash
sudo certbot --nginx -d sige.tu-organismo.gob.cl --non-interactive --agree-tos -m ciso@tu-organismo.gob.cl
```

---

## PASO 6: CONFIGURACIÓN DE INTEGRACIONES OPEN SOURCE TÉCNICAS

### 6.1. Conexión de Wazuh SIEM / XDR (Alertas 3h ANCI & 72h DPO)

1. En el servidor del **Wazuh Manager**, edite `/var/ossec/etc/ossec.conf`:
   ```xml
   <ossec_config>
     <integration>
       <name>custom-lexapp</name>
       <hook_url>http://127.0.0.1:8000/api/gateways/wazuh-alert</hook_url>
       <level>10</level>
       <api_key>Bearer LEXAPP_SECRET_API_KEY_2026_INTEGRATION</api_key>
       <alert_format>json</alert_format>
     </integration>
   </ossec_config>
   ```
2. Cree el script de reenvío en `/var/ossec/integrations/custom-lexapp`:
   ```bash
   sudo bash -c 'cat << "EOF" > /var/ossec/integrations/custom-lexapp
   #!/usr/bin/env python3
   import sys, json, requests

   alert_file = sys.argv[1]
   api_key = sys.argv[3]
   hook_url = sys.argv[4]

   with open(alert_file) as f:
       alert = json.load(f)

   headers = {"Authorization": api_key, "Content-Type": "application/json"}
   requests.post(hook_url, json=alert, headers=headers, timeout=5)
   EOF'
   sudo chmod 750 /var/ossec/integrations/custom-lexapp
   sudo chown root:wazuh /var/ossec/integrations/custom-lexapp
   sudo systemctl restart wazuh-manager
   ```

---

### 6.2. Conexión de Respaldos Inmutables WORM (MinIO / Restic)

1. Cree el script de respaldo nocturno `/usr/local/bin/backup_rsic.sh`:
   ```bash
   sudo bash -c 'cat << "EOF" > /usr/local/bin/backup_rsic.sh
   #!/usr/bin/env bash
   set -euo pipefail

   export RESTIC_REPOSITORY="s3:http://minio.local:9000/rsic-backups"
   export RESTIC_PASSWORD="ClaveSeguraRespaldo2026!"
   export AWS_ACCESS_KEY_ID="minio_admin"
   export AWS_SECRET_ACCESS_KEY="minio_secret_key"

   # 1. Ejecutar el respaldo de las bases de datos
   restic backup /var/lib/postgresql/data --tag database-rsic-01

   # 2. Extraer hash SHA-256 del snapshot inmutable
   SNAPSHOT_HASH=$(restic snapshots --json | jq -r ".[-1].tree")

   # 3. Notificar a LexApp GRC Hub para certificar cumplimiento ANCI
   curl -s -X POST "http://127.0.0.1:8000/api/gateways/backup-heartbeat" \
     -H "Authorization: Bearer LEXAPP_SECRET_API_KEY_2026_INTEGRATION" \
     -H "Content-Type: application/json" \
     -d "{
       \"activo_rsic_id\": 1,
       \"tipo_backup\": \"Snapshot Inmutable WORM\",
       \"destino\": \"MinIO S3 (Object Lock 30d)\",
       \"hash_sha256\": \"$SNAPSHOT_HASH\",
       \"estado\": \"Exitoso\"
     }"
   EOF'
   sudo chmod +x /usr/local/bin/backup_rsic.sh
   ```
2. Prográmelo en el `crontab` para ejecución automática diaria:
   ```bash
   # Ejecutar todos los días a las 02:00 AM:
   (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup_rsic.sh >> /var/log/backup_rsic.log 2>&1") | crontab -
   ```

---

### 6.3. Conexión de Microsoft Presidio NLP (Auditoría de PII)

Instale el motor NLP en el servidor de analítica:
```bash
sudo pip3 install presidio-analyzer psycopg2-binary requests
python3 -m spacy download es_core_news_sm
```

---

## PASO 7: SCRIPT DE ACTUALIZACIÓN AUTOMATIZADA (`./update.sh`)

Para aplicar futuras actualizaciones de código sin interrumpir la operación, cree y utilice el script `/opt/sige-dp/update.sh`:

```bash
cat << 'EOF' > /opt/sige-dp/update.sh
#!/usr/bin/env bash
set -e

echo "🚀 [1/4] Descargando últimos cambios desde Git..."
cd /opt/sige-dp
git pull origin main

echo "🐍 [2/4] Actualizando dependencias de Backend y migraciones..."
cd /opt/sige-dp/backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

echo "⚛️ [3/4] Compilando Frontend de Producción..."
cd /opt/sige-dp/frontend
npm install
npm run build

echo "🔄 [4/4] Reiniciando servicios..."
sudo systemctl restart sige-dp
sudo systemctl reload nginx

echo "✅ ¡Actualización completada exitosamente!"
EOF
chmod +x /opt/sige-dp/update.sh
```

---

## PASO 8: CHECKLIST DE VALIDACIÓN Y SMOKE TEST

Ejecute las siguientes verificaciones para certificar que la instalación fue exitosa:

```bash
# 1. Verificar estado del servicio backend:
sudo systemctl is-active sige-dp
# Debe responder: active

# 2. Probar respuesta directa del endpoint de salud de la API:
curl -I http://127.0.0.1:8000/api/areas
# Debe responder: HTTP/1.1 200 OK (o 401 si requiere token)

# 3. Probar respuesta de Nginx:
curl -I http://localhost
# Debe responder: HTTP/1.1 200 OK

# 4. Probar ingesta de telemetría simulada (Gateway):
curl -X POST http://127.0.0.1:8000/api/gateways/simulate-wazuh-alert \
  -H "Authorization: Bearer LEXAPP_SECRET_API_KEY_2026_INTEGRATION"
```

---

## 10. RESOLUCIÓN DE PROBLEMAS FRECUENTES (TROUBLESHOOTING)

### ❌ Error 1: "502 Bad Gateway" en el Navegador
* **Causa:** El servicio backend `sige-dp.service` está detenido o falló al iniciar.
* **Solución:**
  ```bash
  # Ver los logs del error en tiempo real:
  sudo journalctl -u sige-dp.service -n 50 --no-pager
  
  # Verificar si el puerto 8000 está ocupado:
  sudo netstat -tulpn | grep 8000
  ```

### ❌ Error 2: "Permiso denegado" al escribir en la base de datos `dp.db`
* **Causa:** El usuario del servicio no tiene permisos sobre la carpeta del backend.
* **Solución:**
  ```bash
  sudo chown -R ubuntu:ubuntu /opt/sige-dp/backend/
  sudo chmod 664 /opt/sige-dp/backend/dp.db*
  ```

### ❌ Error 3: El Frontend muestra pantalla en blanco
* **Causa:** Error en la compilación de Vite o ruta incorrecta en Nginx.
* **Solución:**
  ```bash
  cd /opt/sige-dp/frontend && npm run build
  sudo nginx -t && sudo systemctl reload nginx
  ```

---

*Manual de Setup en Cliente generado por LexApp GRC Hub · Acreditación Regulatoria Plena Ley N° 21.719 y Ley N° 21.663.*
