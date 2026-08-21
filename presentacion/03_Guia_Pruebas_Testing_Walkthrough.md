# SCRIPT 3: GUÍA PASO A PASO PARA PROBAR LA PLATAFORMA (TESTING WALKTHROUGH)
## PROTOCOLO DE VALIDACIÓN FUNCIONAL, DEMOSTRACIÓN Y CONTROL DE CALIDAD
**Objetivo:** Guiar al evaluador o presentador en un recorrido de prueba paso a paso de punta a punta, validando que todas las capacidades operen correctamente.  
**Duración Estimada:** 10 a 15 minutos  
**Requisitos:** Navegador moderno (Chrome/Firefox/Edge) y credenciales de acceso.

---

### PASO 1: Inicio de Sesión y Dashboard de Protección de Datos

1. Ingresa a la URL de tu instancia (ej. `http://tu-servidor-ip`).
2. Inicia sesión con tus credenciales de Encargado/a de Cumplimiento (DPO).
3. **Verificación visual en pantalla:**
   * Verifica la **cuenta regresiva** al 1 de diciembre de 2026 en días, horas y minutos.
   * Observa el gráfico circular de **Avance Ponderado**.
   * Revisa la **campana de notificaciones** en la barra superior derecha.
   * Revisa al pie de página el **Cronograma y Calendario Regulatorio GRC (2026-2027)** con filtros por ley.
4. **Acción de prueba:** Haz clic en el botón superior **`Plan Anual de Privacidad (MD)`** y confirma que se descargue el archivo Markdown con el plan institucional del DPO.

---

### PASO 2: Carta Gantt Metodológica y Homologación Externa

1. En el menú de navegación izquierdo, haz clic en **`Proyecto (6 Fases)`**.
2. Despliega la **Fase 1: Primeros Pasos y Gobernanza**.
3. **Acción de prueba:** Haz clic en el icono de deslizador `Sliders` en la cabecera de la fase para alternar **"Resuelto Externamente"**.
4. Ingresa un motivo (ej. *"Auditoría externa previa realizada por consultora en enero 2026"*).
5. Confirma el guardado y observa cómo la fase pasa a `100% Completo (Resuelto Externamente)` y el velocímetro de avance general se recalcula de inmediato.

---

### PASO 3: Riesgos, EIPD y Simulador de Multas en UTM

1. En el menú izquierdo, haz clic en **`Riesgos y EIPD`**.
2. Explora la **Matriz de Riesgos 5x5** haciendo clic en celdas de riesgo alto/crítico.
3. Cambia a la pestaña **`Simulador de Sanciones (Art. 50)`**.
4. **Acción de prueba:**
   * Selecciona una gravedad: *Infracción Grave (Hasta 10.000 UTM)*.
   * Marca y desmarca los checks de atenuantes (*DPO designado, LexApp GRC implementado, Cooperación proactiva*).
   * Comprueba cómo el cálculo de multa estimada en UTM y Pesos Chilenos (CLP) disminuye en tiempo real con hasta un 80% de descuento legal.

---

### PASO 4: Terceros, Proveedores y Transferencias Internacionales

1. Haz clic en **`Terceros/Proveedores`**.
2. Verifica los badges de estado contractual: `✓ DPA Firmado` y `✓ Cláusula ANCI <24h`.
3. Haz clic en la pestaña **`Transferencias Internacionales (Art. 28)`** y revisa la clasificación geográfica de servidores (Chile vs. Estados Unidos / Unión Europea).
4. **Acción de prueba:** En cualquier proveedor, haz clic en el botón **`Contrato Unificado (MD)`** para descargar el anexo contractual formal que une la Ley 21.719 y la Ley 21.663.

---

### PASO 5: Simulador de Fiscalización de la Agencia de Datos

1. Haz clic en **`Auditoría & ZIP`** y selecciona la pestaña **`Simulador de Fiscalización`**.
2. Marca los 10 requisitos del checklist de inspección legal.
3. Verifica el cálculo dinámico del **Índice de Preparación (Readiness Score)**.
4. **Acción de prueba:**
   * Haz clic en **`Descargar Certificado Oficial (MD)`** para obtener el acta de acreditación.
   * Haz clic en **`Descargar Expediente ZIP`** y comprueba la descarga del archivo comprimido con las evidencias estructuradas por carpetas.

---

### PASO 6: Cambio a la Suite de Ciberseguridad (ANCI)

1. En el selector superior o en la barra lateral, haz clic en **`Ciber (L21.663)`**.
2. Verifica el cambio temático a color índigo/azul y la actualización de los módulos.
3. **Acción de prueba:** En el encabezado del Dashboard ANCI, haz clic en **`Plan Anual de Ciberseguridad (MD)`** y valida la descarga del documento del CISO.

---

### PASO 7: Activos Críticos RSIC y Escaneo CIS Benchmark

1. En el menú izquierdo, haz clic en **`Activos Críticos (RSIC / OIV)`**.
2. Revisa el catálogo de servidores, bases de datos y servicios esenciales.
3. **Acción de prueba 1:** En un activo (ej. *Servidor de Base de Datos Producción*), haz clic en **`Escanear CIS`**. Observa la animación del escáner y la actualización del score de seguridad.
4. **Acción de prueba 2:** Haz clic en **`Script Hardening (.sh)`** para descargar el script Bash personalizado de aseguramiento del servidor.

---

### PASO 8: Centro de Mando de Incidentes y Alerta 3 Horas

1. Haz clic en **`Incidentes ANCI (3h / 72h)`**.
2. **Acción de prueba 1:** Haz clic en el botón rojo pulsante **`BOTÓN DE PÁNICO (3H)`**.
3. Ingresa un título de prueba (ej. *"Incidente Ransomware en Servidor de Archivos"*), selecciona severidad crítica y guarda.
4. Observa cómo se activa el temporizador perentorio de **3 horas** y se genera una alerta urgente en la campana superior.
5. **Acción de prueba 2:** Haz clic en el botón superior **`Libro de Incidentes (MD)`** y valida la descarga de la bitácora legal conforme al Art. 10 de la Ley 21.663.

---

### PASO 9: Madurez NIST, Matriz Cruzada y War Games

1. Haz clic en **`Madurez NIST / ANCI`**.
2. Revisa la pestaña **`Diagnóstico NIST CSF`** y luego entra a **`Matriz Cruzada (Crosswalk GRC)`** para observar la correspondencia entre ISO 27001, NIST CSF 2.0 y las leyes chilenas.
3. Entra a **`Simulador de Crisis / War Games`** y haz clic en **`Generar Acta de Simulacro (MD)`** en el ejercicio de Ransomware.

---

### PASO 10: Exploración de los Stacks Open Source

1. En la Suite de Ciberseguridad, baja al final del menú y haz clic en **`Stack Open Source (NIS2)`**.
   * Revisa las soluciones (*Wazuh, TheHive, MISP, Greenbone, Keycloak, MinIO WORM*).
   * Prueba los botones **`Copiar`** de los snippets de código Bash y Docker Compose.
   * Haz clic en **`Descargar Blueprint Completo (MD)`**.
2. Cambia a la Suite de Datos y haz clic en **`Stack Open Source (GDPR)`** (al final del menú).
   * Revisa las soluciones de privacidad (*Microsoft Presidio, Klaro!, ARX, Fides, HashiCorp Vault*).
   * Descarga el **Blueprint de Privacidad en Markdown**.

---

### 📋 CHECKLIST DE VALIDACIÓN FINAL

| N° | Módulo / Capacidad | Resultado Esperado | Estado |
| :---: | :--- | :--- | :---: |
| 1 | **Dashboard Dual** | Relojes y cronograma regulatorio visibles y sincronizados | [ OK ] |
| 2 | **Planes Anuales** | Descarga de planes MD para DPO y CISO funcionando | [ OK ] |
| 3 | **Homologación Externa** | Permite marcar fases con 100% de avance externo | [ OK ] |
| 4 | **Simulador de Multas** | Cálculo dinámico en UTM y CLP con atenuantes | [ OK ] |
| 5 | **Transferencias Int.** | Clasificación de proveedores locales vs internacionales | [ OK ] |
| 6 | **Alerta 3 Horas ANCI** | Botón de pánico activa temporizador de cuenta regresiva | [ OK ] |
| 7 | **Escaneo CIS RSIC** | Ejecuta análisis y descarga script de hardening Bash | [ OK ] |
| 8 | **Expedientes ZIP** | Genera compendios comprimidos de evidencias oficiales | [ OK ] |
| 9 | **Stack Open Source** | Guías interactivas y blueprints descargables en ambas suites | [ OK ] |
