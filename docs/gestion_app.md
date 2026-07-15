# Guía de Gestión y Operación de la Aplicación (SIGE-DP)

Este documento detalla los procedimientos necesarios para iniciar (subir) y detener (bajar) la plataforma en sus distintos entornos de ejecución local.

---

## Método 1: Ejecución Local Nativa (Recomendado sin Docker)

Este es el método activo actualmente en tu equipo. Utiliza un entorno virtual de Python para el backend (con base de datos local SQLite) y Node.js para el frontend.

### 1. Cómo iniciar (subir) la aplicación

Para levantar toda la suite de desarrollo, debes iniciar tanto el backend como el frontend.

#### A. Iniciar el Backend (FastAPI + SQLite)
1. Abre una terminal de **PowerShell** en la raíz del proyecto (`c:\CODEA\DP\DP-main`).
2. Cámbiate al directorio de backend:
   ```powershell
   cd backend
   ```
3. Activa el entorno virtual e inicia el servidor con Uvicorn:
   ```powershell
   .\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
   *Nota: La base de datos SQLite se creará y sembrará automáticamente en `backend/sql_app.db` si no existe.*

#### B. Iniciar el Frontend (React + Vite)
1. Abre **otra** ventana/pestaña de terminal en la raíz del proyecto.
2. Cámbiate al directorio de frontend:
   ```powershell
   cd frontend
   ```
3. Levanta el servidor de desarrollo de Vite:
   ```powershell
   npm run dev
   ```

Una vez que ambos comandos estén en ejecución:
*   Acceso web: **[http://localhost:5173](http://localhost:5173)**
*   Documentación API: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 2. Cómo detener (bajar) la aplicación

Para apagar la aplicación de forma manual en modo nativo:

1. Ve a las ventanas de la terminal donde se ejecutan los comandos anteriores.
2. Presiona la combinación de teclas **`Ctrl + C`** en cada terminal para finalizar el proceso.
3. Si el puerto se queda tomado o quieres forzar el cierre de todos los procesos en conflicto en Windows, puedes ejecutar los siguientes comandos en PowerShell de forma rápida:

   ```powershell
   # Detiene el proceso del puerto 8000 (Backend)
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force -ErrorAction SilentlyContinue

   # Detiene el proceso del puerto 5173 (Frontend)
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force -ErrorAction SilentlyContinue
   ```

---

## Método 2: Control mediante Scripts Automatizados (.ps1)

Para tu comodidad, he creado dos scripts en la raíz del proyecto:

1.  **`iniciar.ps1`**: Levanta tanto el backend como el frontend en pestañas en segundo plano.
2.  **`detener.ps1`**: Libera los puertos de desarrollo deteniendo los procesos asociados de Node y Python de manera limpia.

*Para utilizarlos en PowerShell, ejecuta en la raíz:*
```powershell
.\iniciar.ps1
# O bien:
.\detener.ps1
```

---

## Método 3: Ejecución con Docker Compose (Si se instala Docker Desktop en el futuro)

En caso de que en un futuro decidas instalar la herramienta Docker Desktop, la gestión se unifica de la siguiente manera:

1.  **Subir la aplicación:**
    ```bash
    docker compose up --build -d
    ```
    *(Esto construirá las imágenes del frontend y backend, iniciará una base de datos PostgreSQL aislada y dejará los servicios corriendo en segundo plano).*

2.  **Bajar la aplicación:**
    ```bash
    docker compose down
    ```
    *(Detiene y remueve los contenedores y redes creados, manteniendo persistentes los datos de la base de datos).*
