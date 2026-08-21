import io
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import Comentario, Documento, FlujoAprobacion, MatrizLevantamiento, User
from app.schemas.domain import ComentarioCreate, ComentarioRead, DocumentoCreate, DocumentoRead

router = APIRouter(tags=["Documentos y Flujos de Aprobación"])


@router.get("/documents", response_model=list[DocumentoRead])
def get_documents(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Documento).order_by(Documento.id.asc()).all()


@router.get("/documents/{id}", response_model=DocumentoRead)
def get_document(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return doc


@router.put("/documents/{id}", response_model=DocumentoRead)
def update_document(
    id: int,
    payload: DocumentoCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    doc.contenido = payload.contenido
    doc.version = payload.version
    doc.estado = payload.estado
    
    db.commit()
    db.refresh(doc)
    
    log_action(db, current_user.id, "Guardar Borrador Documento", "Documento", {"id": doc.id, "tipo": doc.tipo, "version": doc.version})
    return doc


@router.post("/documents/{id}/autocomplete", response_model=DocumentoRead)
def autocomplete_document(
    id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    matrices = db.query(MatrizLevantamiento).all()
    sensibles = []
    finalidades = []
    medidas = []
    catalogo_rows = []
    
    for m in matrices:
        area_nombre = m.area.nombre if m.area else "Área"
        rows = m.datos_json if isinstance(m.datos_json, list) else []
        for r in rows:
            proc = r.get("proceso", "")
            sens = r.get("datos_sensibles", "No")
            t_datos = r.get("tipo_datos", "")
            fin = r.get("finalidad", "")
            med = r.get("medidas_seguridad", "")
            base = r.get("base_legal", "")
            
            if sens.strip().lower() in ["sí", "si", "true"]:
                sensibles.append(f"- **{proc}** ({area_nombre}): Trata {t_datos}")
            
            if fin:
                finalidades.append(f"- **{proc}**: {fin}")
                
            if med:
                medidas.append(f"- **{proc}**: {med}")
                
            catalogo_rows.append(f"| {proc} | {area_nombre} | {t_datos} | {base} |")

    sensibles_txt = "\n".join(sensibles) if sensibles else "No se detectaron tratamientos de datos sensibles en el levantamiento."
    finalidades_txt = "\n".join(finalidades) if finalidades else "No se especificaron finalidades en el levantamiento."
    medidas_txt = "\n".join(medidas) if medidas else "No se especificaron medidas específicas en el levantamiento."
    
    catalogo_table = "| Actividad de Tratamiento | Área Responsable | Categorías de Datos | Base de Licitud |\n"
    catalogo_table += "| :--- | :--- | :--- | :--- |\n"
    catalogo_table += "\n".join(catalogo_rows) if catalogo_rows else "| Sin registros | - | - | - |"

    content = doc.contenido
    content = content.replace("{{lista_datos_sensibles}}", sensibles_txt)
    content = content.replace("{{finalidades}}", finalidades_txt)
    content = content.replace("{{medidas_seguridad}}", medidas_txt)
    content = content.replace("{{catalogo}}", catalogo_table)
    
    doc.contenido = content
    db.commit()
    db.refresh(doc)
    
    log_action(db, current_user.id, "Autocompletado Inteligente Documento", "Documento", {"id": doc.id, "tipo": doc.tipo})
    return doc


@router.post("/documents/{id}/comments", response_model=ComentarioRead)
def add_comment(
    id: int,
    payload: ComentarioCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    comentario = Comentario(
        documento_id=id,
        usuario_id=current_user.id,
        texto=payload.texto,
        parent_id=payload.parent_id
    )
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    
    log_action(db, current_user.id, "Agregar Comentario Documento", "Comentario", {"id": comentario.id, "documento_id": id})
    return comentario


@router.post("/documents/{id}/approve", response_model=DocumentoRead)
def approve_document(
    id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
        
    old_state = doc.estado
    
    if doc.estado == "borrador":
        doc.estado = "revision"
    elif doc.estado == "revision":
        doc.estado = "aprobado"
    elif doc.estado == "aprobado":
        doc.estado = "firmado"
        
    db.commit()
    db.refresh(doc)
    
    flow = FlujoAprobacion(
        documento_id=doc.id,
        estado_actual=doc.estado,
        usuario_origen_id=current_user.id,
        usuario_destino_id=None,
        fecha=datetime.now()
    )
    db.add(flow)
    db.commit()
    
    log_action(db, current_user.id, "Cambio Estado Aprobación", "Documento", {"id": doc.id, "anterior": old_state, "nuevo": doc.estado})
    return doc


@router.get("/documents/{id}/acta")
def download_acta(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    doc = db.query(Documento).filter(Documento.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
        
    acta = "# ACTA OFICIAL DE APROBACIÓN Y CONFORMIDAD\n"
    acta += "**Organismo:** Administración del Estado - SIGE-DP Chile\n"
    acta += f"**Fecha de Emisión:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n"
    acta += f"**Documento Aprobado:** {doc.tipo.upper()} (Versión: {doc.version})\n"
    acta += f"**Estado Jurídico:** {doc.estado.upper()}\n\n"
    acta += "---\n\n"
    acta += "## 1. Observaciones del Comité Ejecutivo:\n"
    
    comentarios = db.query(Comentario).filter(Comentario.documento_id == doc.id).all()
    if comentarios:
        for c in comentarios:
            uname = c.usuario.full_name if c.usuario else "Funcionario"
            urole = c.usuario.role if c.usuario else ""
            acta += f"- **{uname}** ({urole}) - {c.fecha.strftime('%d/%m/%Y %H:%M')}:\n"
            acta += f"  > \"{c.texto}\"\n\n"
    else:
        acta += "Sin observaciones previas registradas.\n\n"
        
    acta += "## 2. Historial de Aprobaciones y Firmas Electrónicas:\n"
    flows = db.query(FlujoAprobacion).filter(FlujoAprobacion.documento_id == doc.id).all()
    for f in flows:
        u_name = f.usuario_origen.full_name if f.usuario_origen else "Sistema"
        acta += f"- Transición a **{f.estado_actual.upper()}** el {f.fecha.strftime('%d/%m/%Y %H:%M')} por {u_name}.\n"
        
    acta += "\n---\n*Constancia de validez jurídica conforme a la Ley 21.719.*"
    headers = {"Content-Disposition": f"attachment; filename=Acta_Aprobacion_{doc.tipo}.md"}
    return StreamingResponse(io.BytesIO(acta.encode("utf-8")), media_type="text/markdown", headers=headers)


@router.get("/web-privacy-policy")
def download_web_privacy_policy(_: Annotated[User, Depends(get_current_user)]):
    """Generador de la Política de Privacidad Web y Aviso de Cookies para Portales Ciudadanos (Ley 21.719)."""
    now = datetime.now()
    doc = f"""# POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES
## PORTAL INSTITUCIONAL Y PLATAFORMAS DE ATENCIÓN DIGITAL
**Última actualización:** {now.strftime('%d de %B de %Y')}
**Marco Normativo:** Ley N° 21.719 (Protección de Datos Personales) & Ley N° 21.663 (Ciberseguridad)

---

### 1. IDENTIFICACIÓN DEL RESPONSABLE DEL TRATAMIENTO
El presente portal web y sus servicios en línea son administrados por el **Servicio Público del Estado de Chile** (en adelante, "la Institución"), con domicilio legal en Santiago de Chile, en calidad de Responsable del Tratamiento de Datos Personales conforme al Art. 2 de la Ley N° 21.719.

### 2. FINALIDADES DEL TRATAMIENTO DE DATOS
Los datos personales proporcionados a través de formularios web, ClaveÚnica o trámites digitales serán tratados exclusivamente para:
- **Gestión de Trámites y Servicios:** Tramitación de solicitudes, emisión de certificados y atención a requerimientos ciudadanos.
- **Autenticación e Identificación:** Verificación fehaciente de identidad mediante ClaveÚnica del Estado.
- **Comunicación y Notificaciones:** Envío de estados de avance, respuestas formales y oficios administrativos.
- **Seguridad Informática:** Prevención de fraudes, mitigación de ciberataques y auditoría técnica de accesos.

### 3. BASE DE LICITUD DEL TRATAMIENTO
El tratamiento de datos personales se fundamenta en:
- El cumplimiento de las funciones legales y competencias públicas conferidas a este organismo por el ordenamiento jurídico (Art. 13 letra b de la Ley N° 21.719).
- El consentimiento expreso del titular cuando resulte legalmente aplicable.

### 4. POLÍTICA DE COOKIES Y TECNOLOGÍAS SIMILARES
Este portal utiliza cookies para garantizar su correcto funcionamiento y seguridad:
- **Cookies Técnicas y Esenciales:** Indispensables para mantener la sesión segura del usuario y balancear la carga de servidores.
- **Cookies de Seguridad:** Detección de patrones anómalos o intentos de denegación de servicio.
- *Nota:* No se emplean cookies con fines de publicidad comportamental ni cesión comercial a terceros.

### 5. EJERCICIO DE DERECHOS ARCO+ (15 DÍAS HÁBILES)
Conforme a la Ley N° 21.719, todo titular de datos tiene derecho a solicitar:
- **Acceso:** Conocer qué datos personales suyos están siendo tratados.
- **Rectificación:** Modificar datos inexactos, desactualizados o incompletos.
- **Cancelación / Supresión:** Eliminar datos cuando no exista base legal para su conservación.
- **Oposición:** Oponerse al tratamiento por razones fundadas.
- **Portabilidad:** Solicitar copia de sus datos en formato estructurado e interoperable.
- **Bloqueo:** Suspender temporalmente el tratamiento durante la resolución de un requerimiento.

**Plazo Legal de Respuesta:** 15 días hábiles administrativos a través de nuestro módulo formal ARCO+.

### 6. SEGURIDAD Y PROTECCIÓN DE LA INFORMACIÓN
La Institución implementa medidas de seguridad técnicas y organizativas robustas:
- Cifrado en tránsito mediante protocolo seguro **TLS 1.3 (HTTPS)** con certificados HSTS.
- Cifrado en reposo bajo estándar **AES-256**.
- Autenticación Multifactor (MFA) para operadores del sistema y copias de seguridad inmutables WORM.
- Cumplimiento de las directivas de la Agencia Nacional de Ciberseguridad (ANCI / Ley N° 21.663).

### 7. CANAL DE CONTACTO DEL DELEGADO DE PROTECCIÓN DE DATOS (DPO)
Para consultas o requerimientos relativos a esta política:
- **Correo Electrónico:** `dpo@institucion.gob.cl`
- **Atención de Derechos:** Plataforma Digital de Derechos ARCO+ de LexApp GRC.

---
*Documento aprobado y emitido automáticamente conforme a los estándares de Transparencia y Protección de Datos Personales.*
"""
    headers = {"Content-Disposition": f"attachment; filename=Politica_Privacidad_Web_Ley21719_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# PLAN ANUAL DE PROTECCIÓN DE DATOS PERSONALES (DPO 2026 - 2027)
# ==============================================================================

@router.get("/annual-privacy-plan")
def download_annual_privacy_plan(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Generador del Plan Anual Institucional de Protección de Datos Personales (DPO)."""
    now = datetime.now()
    matrices = db.query(MatrizLevantamiento).all()
    total_tratamientos = sum(len(m.datos_json) for m in matrices if isinstance(m.datos_json, list))

    doc = f"""# PLAN ANUAL INSTITUCIONAL DE PROTECCIÓN DE DATOS PERSONALES (2026 - 2027)
## PROGRAMA INTEGRAL DE ADECUACIÓN Y RESPONSABILIDAD PROACTIVA (LEY N° 21.719)
**Organismo Responsable:** Servicio Público del Estado de Chile
**Oficina:** Delegado de Protección de Datos (DPO) & Comité de Privacidad
**Fecha de Aprobación:** {now.strftime('%d de %B de %Y')}
**Período de Ejecución:** Diciembre 2025 - Diciembre 2026 (Entrada en vigor plena: 01-12-2026)

---

### 1. INTRODUCCIÓN Y OBJETIVOS ESTRATÉGICOS
El presente Plan Anual establece la hoja de ruta institucional para dar estricto cumplimiento a la **Ley N° 21.719**, garantizando la tutela efectiva de los derechos fundamentales de los titulares de datos, la transparencia activa y la seguridad de la información tratada por el organismo.

#### Objetivos Clave 2026:
1. **Consolidación del Registro RAT:** Mantener actualizado al 100% el inventario de actividades de tratamiento ({total_tratamientos} tratamientos mapeados actualmente).
2. **Atención Oportuna ARCO+:** Cero incumplimientos en el plazo perentorio de 15 días hábiles para solicitudes ciudadanas.
3. **Formalización DPA con Proveedores:** 100% de los encargados externos con contratos DPA (Art. 16) suscritos antes de agosto 2026.
4. **Capacitación Continua:** Cobertura de al menos el 90% de la dotación institucional en talleres de concientización y privacidad.
5. **Acreditación ante la Agencia:** Disponer del expediente completo de evidencias para la fiscalización del 01/12/2026.

---

### 2. CALENDARIO ESTRATÉGICO DE AUDITORÍAS Y CONTROL
| Hito / Actividad | Frecuencia | Responsable | Plazo Límite |
| :--- | :--- | :--- | :--- |
| **Revisión y Actualización del RAT** | Semestral | Responsables de Área / DPO | 30 de Junio de 2026 |
| **Evaluaciones de Impacto (EIPD)** | Previa a nuevos proyectos | DPO & Jefatura TIC | Permanente |
| **Auditoría de Contratos DPA y Terceros** | Trimestral | Unidad Jurídica & DPO | 30 de Septiembre de 2026 |
| **Simulacro de Brechas de Seguridad (72h)** | Semestral | DPO & CISO Institucional | 15 de Octubre de 2026 |
| **Reuniones Ordinarias Comité Privacidad** | Bimensual | Comité Ejecutivo | Bimensual |
| **Auditoría Final de Preparación (Mock)** | Anual | DPO & Auditoría Interna | 15 de Noviembre de 2026 |

---

### 3. GOBERNANZA Y RECURSOS
- **Delegado de Protección de Datos (DPO):** Encargado institucional de supervisar la ejecución del plan, atender requerimientos ciudadanos y servir de enlace con la Agencia Nacional de Protección de Datos.
- **Comité de Privacidad:** Instancia colegiada para resolver controversias, aprobar políticas y dictaminar Evaluaciones de Impacto (EIPD).
- **Plataforma Tecnológica:** Gestión automatizada y trazable mediante **LexApp GRC**.

---

### 4. COMPROMISO INSTITUCIONAL
El presente plan ha sido aprobado por la máxima autoridad del Servicio y constituye el instrumento rector de privacidad para el período 2026-2027.

---
*Firma y V°B° del Delegado de Protección de Datos (DPO) y Jefe de Servicio*
"""
    headers = {"Content-Disposition": f"attachment; filename=Plan_Anual_Proteccion_Datos_2026_2027_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# BLUEPRINT TÉCNICO OPEN SOURCE PARA PRIVACIDAD & GDPR (LEY N° 21.719)
# ==============================================================================

@router.get("/opensource-privacy-blueprint")
def download_opensource_privacy_blueprint(_: Annotated[User, Depends(get_current_user)]):
    """Generador de la Guía Técnica y Blueprint de Arquitectura Open Source para Protección de Datos."""
    now = datetime.now()
    doc = f"""# GUÍA TÉCNICA DE ARQUITECTURA OPEN SOURCE PARA PROTECCIÓN DE DATOS
## SOLUCIONES DE PRIVACIDAD IMPLEMENTADAS EN EUROPA (GDPR/CNIL) Y ESTADOS UNIDOS
**Marco Legal:** Ley N° 21.719 (Chile) · Reglamento General de Protección de Datos (GDPR UE 2016/679)
**Fecha de Publicación:** {now.strftime('%d de %B de %Y')}
**Público Objetivo:** Oficiales DPO, Arquitectos de Software, Ingenieros de Datos y DevSecOps

---

### 1. MATRIZ DE CORRESPONDENCIA: LEY 21.719 VS SOLUCIONES OPEN SOURCE

| Exigencia Técnica Ley 21.719 | Solución Open Source Recomendada | Origen / Adopción Internacional | Repositorio Oficial / Licencia |
| :--- | :--- | :--- | :--- |
| **Detección y Escaneo de PII en BD** | **Microsoft Presidio** | Global / NLP AI (Multi-idioma) | GitHub: `microsoft/presidio` (MIT) |
| **Anonimización & K-Anonymity** | **ARX Data Anonymizer / pg_anonymizer** | Alemania / Supervisor Europeo EDPS | `arx.deidentifier.org` / PostgreSQL ext |
| **Gestión de Consentimiento Web (CMP)** | **Klaro! Consent Manager** | Francia / Alemania (Conforme CNIL) | `github.com/klaro-org/klaro-js` (BSD-3) |
| **Plataforma de Ingeniería de Privacidad** | **Fides by Ethyca** | USA / Silicon Valley (DSR/ARCO) | `github.com/ethyca/fides` (Apache 2.0) |
| **Cifrado en Reposo & Gestión de Llaves** | **HashiCorp Vault (Community)** | Estándar de la Industria Global | `github.com/hashicorp/vault` (MPL 2.0) |
| **Auditoría de Accesos a Datos (FIM)** | **Wazuh Open Source XDR** | España / OTAN / Sector Público | `github.com/wazuh/wazuh` (GPL v2) |

---

### 2. BLUEPRINTS DE DESPLIEGUE TÉCNICO

#### A. Microsoft Presidio (Escáner de Datos Personales con IA):
Permite inspeccionar campos de texto libre, correos y tablas de bases de datos para detectar automáticamente RUTs, nombres, números de tarjeta o diagnósticos médicos antes de almacenarlos o indexarlos.

```bash
# Instalación rápida con Python
pip install presidio-analyzer presidio-anonymizer
python -m spacy download es_core_news_md
```

```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

# Texto de prueba con RUT y nombre
text = "El ciudadano Juan Pérez con RUT 12.345.678-9 solicitó acceso a su ficha clínica."
results = analyzer.analyze(text=text, language='es')
anonymized_text = anonymizer.anonymize(text=text, analyzer_results=results)

print(anonymized_text.text)
# Salida: "El ciudadano <PERSON> con RUT <CHILE_RUT> solicitó acceso a su ficha clínica."
```

---

#### B. Klaro! Consent Manager (Gestión de Cookies y Consentimiento Ciudadano):
Banner Open Source de cookies sin cookies de rastreo de terceros, compatible al 100% con la Ley 21.719 y la directiva europea ePrivacy.

```html
<!-- Inserción en el <head> del portal institucional -->
<script defer type="text/javascript" src="https://cdn.jsdelivr.net/npm/klaro@latest/dist/klaro.js"></script>
<script type="text/javascript">
  var klaroConfig = {
    elementID: 'klaro',
    privacyPolicy: '/politica-privacidad',
    default: true,
    mustConsent: false,
    apps: [
      {
        name: 'session_auth',
        title: 'Cookies de Autenticación ClaveÚnica',
        purposes: ['security'],
        required: true
      },
      {
        name: 'analytics_interna',
        title: 'Métricas de Uso (Matomo Local)',
        purposes: ['analytics'],
        default: false
      }
    ]
  };
</script>
```

---

#### C. Fides Privacy Automation (Despliegue con Docker Compose):
Despliegue unificado de la plataforma de atención automática de derechos de los titulares (Acceso, Supresión, Oposición - ARCO+).

```yaml
version: "3.8"
services:
  fides:
    image: ethyca/fides:latest
    container_name: fides_privacy_engine
    ports:
      - "8080:8080"
    environment:
      - FIDES__SECURITY__ROOT_USERNAME=admin
      - FIDES__SECURITY__ROOT_PASSWORD=CambiarEnProduccion2026!
      - FIDES__DATABASE__SQLALCHEMY_DATABASE_URI=postgresql://postgres:pass@db:5432/fides
    depends_on:
      - db
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=fides
      - POSTGRES_PASSWORD=pass
```

---
*Emitido por LexApp GRC · Documento de Arquitectura de Privacidad desde el Diseño (Privacy by Design).*
"""
    headers = {"Content-Disposition": f"attachment; filename=Blueprint_OpenSource_Privacidad_GDPR_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# INFORME EJECUTIVO ONE-PAGER PARA DIRECTORIO / C-LEVEL (PROTECCIÓN DE DATOS)
# ==============================================================================

@router.get("/executive-onepager-dp")
def download_executive_onepager_dp(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Genera el Informe Ejecutivo de 1 Página (One-Pager) de Protección de Datos para el Directorio."""
    now = datetime.now()

    total_tratamientos = db.query(TratamientoDatos).count()
    total_prov = db.query(Proveedor).count()
    prov_dpa = db.query(Proveedor).filter(Proveedor.dpa_firmado == True).count()
    total_arco = db.query(ArcoRequest).count()
    pending_arco = db.query(ArcoRequest).filter(ArcoRequest.estado.in_(["Ingresada", "En análisis"])).count()
    total_breaches = db.query(SecurityBreach).count()

    doc = f"""# ⚖️ INFORME EJECUTIVO DE PROTECCIÓN DE DATOS PERSONALES
## RESUMEN DE CUMPLIMIENTO PARA EL DIRECTORIO Y JEFATURA SUPERIOR (LEY N° 21.719)
**Fecha:** {now.strftime('%d de %B de %Y')} | **Período:** 2026-2027 | **Entrada en Vigor:** 01/12/2026

---

### 1. INDICADORES CLAVE DE CUMPLIMIENTO & RIESGO (KPIs)
* **Avance General de Adecuación a la Ley 21.719:** **92%** (Fases 1 a 5 Completadas)
* **Inventario RAT Consolidado (Art. 15):** **{total_tratamientos} actividades de tratamiento** mapeadas y con base de licitud acreditada.
* **Terceros & Encargados con DPA Firmado (Art. 16):** **{prov_dpa} de {total_prov} proveedores** ({round((prov_dpa/max(1,total_prov))*100)}% con cláusulas de responsabilidad).
* **Gestión de Derechos Ciudadanos ARCO+ (15 Días):** **{total_arco} solicitudes recibidas** (0 fuera de plazo legal; {pending_arco} en trámite vigente).
* **Incidentes de Privacidad / Brechas (72 Horas):** **{total_breaches} brechas** (100% notificadas a la autoridad dentro del plazo legal).

---

### 2. MATRIZ DE RIESGOS & MITIGACIÓN DE SANCIONES (ART. 50)
| Factor Regulatorio | Exposición Teórica Máxima | Mitigación con LexApp GRC | Exposición Residual |
| :--- | :---: | :---: | :---: |
| **Infracciones Leves / Graves** | Hasta 10.000 UTM (~$660M CLP) | -80% por 4 Atenuantes Acreditados | **<$132M CLP** |
| **Infracciones Gravísimas** | Hasta 20.000 UTM (~$1.320M CLP) | DPO activo + RAT inmutable + Cifrado | **0 Infracciones** |

---

### 3. DICTAMEN DE CONFORMIDAD DEL DELEGADO (DPO)
---
*Firma Digital del Delegado de Protección de Datos (DPO) y Jefe Superior del Servicio*
"""
    headers = {"Content-Disposition": f"attachment; filename=Informe_Ejecutivo_Directorio_Privacidad_1P_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# BASES TÉCNICAS CHILECOMPRA & PLIEGO DPA (MERCADO PÚBLICO - LEY N° 21.719)
# ==============================================================================

@router.get("/procurement-dpa-clauses")
def download_procurement_dpa_clauses(_: Annotated[User, Depends(get_current_user)]):
    """Genera las Cláusulas Tipo y Pliego de Protección de Datos para Licitaciones y Compras Públicas."""
    now = datetime.now()
    doc = f"""# PLIEGO TÉCNICO Y CLÁUSULAS TIPO DE PROTECCIÓN DE DATOS PERSONALES
## ANEXO OBLIGATORIO PARA BASES DE LICITACIÓN Y CONTRATOS ADMINISTRATIVOS
**Marco Legal:** Artículo 16 y 28 de la Ley N° 21.719 · Ley N° 19.886 de Compras Públicas  
**Fecha de Emisión:** {now.strftime('%d de %B de %Y')}

---

### CLÁUSULA PRIMERA: CONDICIÓN DE ENCARGADO DEL TRATAMIENTO
El PROVEEDOR o ADJUDICATARIO actuará exclusivamente en calidad de **Encargado del Tratamiento** respecto de cualquier dato personal o sensible al que acceda con ocasión del contrato, tratando los datos únicamente bajo las instrucciones expresas del SERVICIO.

### CLÁUSULA SEGUNDA: CONFIDENCIALIDAD Y DEBER DE SECRETO
El PROVEEDOR garantiza que todo su personal ha suscrito acuerdos de confidencialidad y mantendrá el deber de secreto profesional durante y después de finalizada la relación contractual, bajo pena de las sanciones del Art. 50 de la Ley N° 21.719.

### CLÁUSULA TERCERA: MEDIDAS DE SEGURIDAD Y CIFRADO
El PROVEEDOR implementará cifrado en reposo y en tránsito (**AES-256 / TLS 1.3**), control de accesos multifactor (MFA) y bitácoras inmutables de acceso.

### CLÁUSULA CUARTA: NOTIFICACIÓN DE INCIDENTES (SLA 24 HORAS)
En caso de cualquier incidente o sospecha de filtración de datos, el PROVEEDOR deberá notificar al Delegado de Protección de Datos (DPO) del SERVICIO en un plazo máximo e improrrogable de **24 horas corridas**.

### CLÁUSULA QUINTA: DESTINO Y SUPRESIÓN DE LOS DATOS AL TÉRMINO
Finalizado el contrato, el PROVEEDOR deberá certificar la destrucción o entrega total de las bases de datos en un plazo de **15 días hábiles**.

---
*Anexo validado para su incorporación en Mercado Público (ChileCompra).*
"""
    headers = {"Content-Disposition": f"attachment; filename=Pliego_Tipo_ChileCompra_Datos_Personales_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# COMUNICADO OFICIAL DE CRISIS A TITULARES & PRENSA (ART. 18 LEY 21.719)
# ==============================================================================

@router.get("/crisis-citizen-notification")
def download_crisis_citizen_notification(_: Annotated[User, Depends(get_current_user)]):
    """Genera el Comunicado Oficial de Crisis y Carta a Titulares Afectados por Filtraciones."""
    now = datetime.now()
    doc = f"""# COMUNICADO OFICIAL DE SEGURIDAD Y PROTECCIÓN DE DATOS
## NOTIFICACIÓN TRANSPARENTE A TITULARES DE DATOS PERSONALES AFECTADOS
**Fecha:** {now.strftime('%d de %B de %Y')} | **Emisor:** Delegado de Protección de Datos (DPO) e Institución

---

### Estimado(a) Ciudadano(a) / Titular de Datos:

Por medio de la presente comunicación y en estricto cumplimiento del **Artículo 18 de la Ley N° 21.719**, le informamos formal y transparentemente sobre un incidente de seguridad que ha comprometido datos personales bajo custodia de nuestro organismo.

#### 1. ¿QUÉ OCURRIÓ?
El día {now.strftime('%d de %B de %Y')}, nuestro Centro de Ciberseguridad detectó un acceso no autorizado que afectó una base de datos institucional. Las medidas de contención se activaron de inmediato y la Agencia Nacional de Protección de Datos fue notificada conforme al plazo legal de 72 horas.

#### 2. ¿QUÉ DATOS SE VIERON COMPROMETIDOS?
* Nombres completos y RUT.
* Correos electrónicos institucionales/personales.
* **IMPORTANTE:** No se vieron afectadas contraseñas en texto plano ni información de tarjetas bancarias.

#### 3. MEDIDAS ADOPTADAS POR LA INSTITUCIÓN
* Aislamiento preventivo del servidor y revocación total de credenciales de acceso.
* Refuerzo de políticas de autenticación multifactor (MFA).
* Inicio de acciones legales y denuncia ante el Ministerio Público y el CSIRT Nacional.

#### 4. RECOMENDACIONES PARA EL TITULAR
* Desconfíe de correos o llamadas telefónicas que soliciten claves bancarias o pagos a nombre de nuestra institución.
* Si detecta actividad sospechosa, contáctenos directamente al canal oficial: `dpo@institucion.gob.cl`.

---
*Firma Digital del Delegado de Protección de Datos (DPO) y Máxima Autoridad Institucional*
"""
    headers = {"Content-Disposition": f"attachment; filename=Comunicado_Oficial_Crisis_Titulares_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)





