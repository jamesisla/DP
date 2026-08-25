# 📋 LexApp GRC — Reglas del Asistente & Convenciones

## 🛠️ Stack Tecnológico
* **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2.
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts.
* **Base de Datos:** SQLite (local / desarrollo) / PostgreSQL (producción).
* **Puertos Locales:**
  * Frontend: `http://localhost:5173`
  * Backend API: `http://localhost:8000` (Docs en `/docs`)

---

## 📐 Convenciones de Código & Arquitectura
1. **Modularidad Simétrica (12:12):**
   * Suite Privacidad (Ley N° 21.719) en `pages/` y `routers/`.
   * Suite Ciberseguridad & ANCI (Ley N° 21.663) en `pages/cyber/` y `routers/cybersecurity.py`.
2. **Validación Estricta:** Todo endpoint debe tener schemas Pydantic de entrada y salida (`backend/app/schemas/domain.py`).
3. **Manejo de Errores:** Usar `HTTPException` con códigos de estado HTTP explícitos y mensajes claros.
4. **Nomenclatura:**
   * Backend: `snake_case` para variables y funciones.
   * Frontend: `camelCase` para variables/funciones, `PascalCase` para componentes React.

---

## 🚫 Restricciones Obligatorias (No-Hacer)
* ❌ **NO dejes binarios, bases de datos (.db) ni dumps en git.**
* ❌ **NO hagas refactorizaciones no solicitadas en módulos ajenos a la tarea.**
* ❌ **NO uses librerías pesadas si una utilidad nativa o ya instalada es suficiente.**
* ❌ **NO borres comentarios arquitectónicos ni docstrings existentes.**

---

## 🔄 Protocolo de Sesión de Desarrollo
1. **Al iniciar:** Leer `.agent/STATE.md` para identificar la tarea en curso.
2. **Antes de editar:** Explicar brevemente el plan (2-3 viñetas).
3. **Al finalizar:** Actualizar `.agent/STATE.md` reflejando el progreso y los siguientes pasos.
