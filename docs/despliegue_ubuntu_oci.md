# Guía de Despliegue Nativo en Ubuntu Minimal (Oracle Cloud OCI Always Free)
## Instancia: VM.Standard.E2.1.Micro (1 OCPU, 1 GB RAM, Ubuntu Minimal 22.04 / 24.04)

Esta guía te permite desplegar **SIGE-DP (Ley 21.719)** de forma **100% nativa** en una instancia Ubuntu Minimal en Oracle Cloud, reduciendo el consumo de RAM del sistema a **menos de 90 MB** y compilando la aplicación directamente desde **GitHub**.

---

## 1. Paso 1: Conexión SSH a tu Instancia OCI
En Ubuntu, el usuario por defecto es `ubuntu`:
```bash
ssh ubuntu@TU_IP_PUBLICA_OCI
```

---

## 2. Paso 2: Optimizar Ubuntu Minimal (Liberar +850 MB de RAM)
Ejecuta el script de optimización para apagar procesos pesados de telemetría OCI, daemons de Snapd, timers de APT y crear 2GB de Swap seguro:

```bash
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/optimize-ubuntu.sh | sudo bash
```

### ¿Qué procesos se desactivan?
* **`oracle-cloud-agent` / `gomon`:** Agentes de telemetría de Oracle Cloud (~150-200 MB).
* **`snapd`:** Daemon de paquetes Snap (~60-80 MB).
* **`multipathd`:** Daemon de almacenamiento redundante no necesario en VPS.
* **`apt-daily.timer`:** Descargas automáticas que saturan la CPU de 1 core.
* **`journald`:** Limitado a 30 MB máximos de logs en memoria.
* **Resultado:** La instancia queda con **~80 MB de RAM ocupada**, dejando más de **850 MB libres**.

---

## 3. Paso 3: Instalación y Compilación Directa desde GitHub

Para descargar el código fuente desde GitHub, compilar el frontend (React/Vite) y levantar el backend con Systemd y Nginx, ejecuta:

```bash
curl -fsSL https://raw.githubusercontent.com/jamesisla/DP/main/scripts/install-native-ubuntu.sh | sudo bash
```

### ¿Qué hace este instalador?
1. Instala Python 3, pip, venv, Nginx, Git, build-essential y Node.js 20 LTS.
2. Clona el repositorio desde `https://github.com/jamesisla/DP.git` en `/opt/sige-dp`.
3. Crea el entorno virtual de Python e instala todas las dependencias del backend.
4. Compila el frontend (`npm run build`) generando los archivos estáticos de producción en `frontend/dist`.
5. Configura el servicio del sistema **`sige-dp.service`** para inicio automático y auto-recuperación ante caídas.
6. Configura **Nginx** como servidor web y proxy inverso hacia el backend en el puerto `8000`.
7. Abre los puertos `80` y `443` en el firewall del sistema operativo.

---

## 4. Paso 4: Abrir Puertos en la Consola de Oracle Cloud (VCN Ingress)

Recuerda habilitar el tráfico HTTP en la consola de Oracle Cloud:
1. Ve a **Networking** → **Virtual Cloud Networks (VCN)** → Clic en tu VCN.
2. Clic en **Security Lists** → **Default Security List**.
3. Añade una regla **Ingress**:
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Destination Port Range:** `80,443`
   * **Description:** `Acceso Web SIGE-DP`

---

## 5. Actualizar la App con Nuevos Cambios de GitHub

Cuando subas cambios a GitHub y quieras aplicarlos inmediatamente en tu servidor, ejecuta:

```bash
sudo /opt/sige-dp/scripts/update-and-rebuild.sh
```
*Este comando baja el último commit de `main`, re-compila el frontend y reinicia el servicio en menos de 10 segundos.*

---

## 6. Comandos Útiles de Administración

* **Ver estado del Backend:** `sudo systemctl status sige-dp`
* **Ver logs en vivo:** `sudo journalctl -u sige-dp -f`
* **Reiniciar Backend:** `sudo systemctl restart sige-dp`
* **Reiniciar Nginx:** `sudo systemctl restart nginx`
* **Ver consumo de memoria:** `free -h` o `htop`

---

## 7. Accesos por Defecto

* **URL de la Aplicación:** `http://TU_IP_PUBLICA_OCI`
* **Documentación API Swagger:** `http://TU_IP_PUBLICA_OCI/docs`
* **Credenciales Demo:**
  * **Email:** `admin@protecciondatos.cl`
  * **Contraseña:** `admin123`
