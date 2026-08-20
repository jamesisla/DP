# Guía de Despliegue Nativo y Optimización en Oracle Cloud (OCI Always Free)
## Instancia: VM.Standard.E2.1.Micro (1 OCPU, 1 GB RAM, Oracle Linux Minimal)

Esta guía explica cómo ejecutar **SIGE-DP (Ley 21.719)** de forma **100% nativa y ultraligera**, reduciendo el consumo del sistema operativo de 511 MB a **menos de 100 MB de RAM**, permitiendo que la aplicación funcione con rapidez, sin Docker y con cero riesgo de agotar la memoria (*Out-of-Memory*).

---

## 1. Diagnóstico del Análisis de Procesos (`proc.png`)

En la captura de `top` (`proc.png`) se identificaron los siguientes procesos que consumen más del 50% de la RAM en la instalación por defecto de Oracle Linux:

| Proceso / Daemon | Consumo RAM Típico | Función en OCI | ¿Es necesario para la App? |
| :--- | :--- | :--- | :--- |
| **`oracle-cloud-agent` / `gomon`** | **180 - 250 MB** | Agente de telemetría y métricas de OCI en la nube. | **No** (Prescindible en uso personal/demo). |
| **`tuned`** | **35 - 50 MB** | Ajuste dinámico de perfiles de CPU/Kernel. | **No** (Se reemplaza por ajustes estáticos). |
| **`dnf-makecache.timer`** | Picos de CPU/RAM | Descarga periódica de metadatos de paquetes. | **No** (Satura CPU de 1 núcleo). |
| **`journald` (sin límite)** | Variable (hasta 150MB) | Almacenamiento de logs de sistema en memoria. | **Se optimiza** a 30 MB máximo. |

---

## 2. Paso 1: Optimizar la Instancia OCI (Liberar +800 MB de RAM)

Conéctate por SSH a tu máquina OCI:
```bash
ssh opc@TU_IP_PUBLICA_OCI
```

Descarga y ejecuta el optimizador de memoria:
```bash
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/optimize-oci.sh | sudo bash
```
*(O clona el repositorio y ejecuta `sudo ./scripts/optimize-oci.sh`)*

### ¿Qué hace este optimizador?
1. Detiene y deshabilita `oracle-cloud-agent`, `gomon` y `tuned`.
2. Fija el límite de logs de `journald` a 30 MB.
3. Ajusta los parámetros del kernel (`vm.swappiness=10`, `vm.vfs_cache_pressure=50`).
4. Configura 2 GB de archivo Swap como protección contra picos de carga.
5. **Resultado:** El consumo base bajará de **511 MB a ~80-100 MB**.

---

## 3. Paso 2: Abrir Puertos en la Consola de Oracle Cloud (VCN Ingress)

Para que tu servidor sea accesible desde Internet, debes abrir el puerto HTTP (80) en el panel de OCI:

1. Entra a tu consola de **Oracle Cloud Infrastructure**.
2. Ve a **Networking** → **Virtual Cloud Networks (VCN)** → Clic en tu VCN.
3. Clic en **Security Lists** → **Default Security List for...**
4. Clic en **Add Ingress Rules**:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80,443`
   * **Description:** `Permitir trafico HTTP/HTTPS SIGE-DP`
5. Clic en **Add Ingress Rules**.

---

## 4. Paso 3: Despliegue Nativo Automático de SIGE-DP

Ejecuta el script de instalación en tu instancia:

```bash
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/install-native-oci.sh | sudo bash
```

### Arquitectura de Ejecución Nativa:
* **Frontend (React + Vite):** Se compila a archivos estáticos HTML/CSS/JS servidos directamente por **Nginx** con compresión Gzip. *(Consumo: ~8 MB RAM)*.
* **Backend (FastAPI + Python 3):** Se ejecuta como un servicio Systemd independiente (`sige-dp.service`) con 1 worker optimizado. *(Consumo: ~45 MB RAM)*.
* **Base de Datos (SQLite con WAL):** Almacenada localmente con soporte transaccional y cero consumo extra de memoria de fondo. *(Consumo: ~0 MB extra)*.

**Consumo Total del Stack Completo:** **~140 MB de 1.000 MB** (Dejando más de **800 MB libres**).

---

## 5. Paso 4: Comandos de Operación y Gestión

### Verificar estado de los servicios:
```bash
sudo systemctl status sige-dp
sudo systemctl status nginx
```

### Ver logs en tiempo real del Backend:
```bash
sudo journalctl -u sige-dp -f
```

### Reiniciar el servicio Backend tras actualizar código:
```bash
sudo systemctl restart sige-dp
```

### Actualizar a la última versión desde GitHub:
```bash
cd /opt/sige-dp
git pull origin main
cd frontend && npm run build
sudo systemctl restart sige-dp
sudo systemctl reload nginx
```

---

## 6. URLs de Acceso Predeterminadas

* **Plataforma Web SIGE-DP:** `http://TU_IP_PUBLICA_OCI`
* **Documentación Interactiva Swagger:** `http://TU_IP_PUBLICA_OCI/docs`
* **Credenciales Demo:**
  * **Correo:** `admin@protecciondatos.cl`
  * **Contraseña:** `admin123`
