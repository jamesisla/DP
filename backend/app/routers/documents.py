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
