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

