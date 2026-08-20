import io
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import SecurityBreach, User
from app.schemas.domain import SecurityBreachCreate, SecurityBreachRead, SecurityBreachUpdate

router = APIRouter(tags=["Brechas e Incidentes de Seguridad (72h)"])


@router.get("/breaches", response_model=list[SecurityBreachRead])
def get_breaches(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(SecurityBreach).order_by(SecurityBreach.fecha_deteccion.desc()).all()


@router.get("/breaches/{id}", response_model=SecurityBreachRead)
def get_breach(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    breach = db.query(SecurityBreach).filter(SecurityBreach.id == id).first()
    if not breach:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    return breach


@router.post("/breaches", response_model=SecurityBreachRead, status_code=status.HTTP_201_CREATED)
def create_breach(
    payload: SecurityBreachCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    now = datetime.now()
    # 72 hours legal deadline for Agencia notification
    deadline_72h = now + timedelta(hours=72)
    
    count = db.query(SecurityBreach).count() + 1
    codigo = f"INC-{now.year}-{str(count).zfill(4)}"
    
    breach = SecurityBreach(
        codigo_incidente=codigo,
        fecha_deteccion=now,
        fecha_limite_notificacion=deadline_72h,
        tipo_incidente=payload.tipo_incidente,
        gravedad=payload.gravedad,
        descripcion=payload.descripcion,
        datos_afectados=payload.datos_afectados,
        cantidad_titulares_afectados=payload.cantidad_titulares_afectados,
        medidas_contencion=payload.medidas_contencion,
        notificado_agencia=False,
        notificado_titulares=False,
        estado="En contención",
        reportado_por_id=current_user.id
    )
    
    db.add(breach)
    db.commit()
    db.refresh(breach)
    
    log_action(db, current_user.id, "Reportar Brecha de Seguridad", "SecurityBreach", {"codigo": breach.codigo_incidente, "gravedad": breach.gravedad, "tipo": breach.tipo_incidente})
    return breach


@router.put("/breaches/{id}", response_model=SecurityBreachRead)
def update_breach(
    id: int,
    payload: SecurityBreachUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    breach = db.query(SecurityBreach).filter(SecurityBreach.id == id).first()
    if not breach:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
        
    old_state = breach.estado
    breach.estado = payload.estado
    breach.medidas_contencion = payload.medidas_contencion
    
    if payload.notificado_agencia and not breach.notificado_agencia:
        breach.notificado_agencia = True
        breach.fecha_notificacion_agencia = datetime.now()
        
    breach.notificado_titulares = payload.notificado_titulares
    
    db.commit()
    db.refresh(breach)
    
    log_action(db, current_user.id, "Actualizar Brecha de Seguridad", "SecurityBreach", {"codigo": breach.codigo_incidente, "anterior": old_state, "nuevo": breach.estado, "notificado_agencia": breach.notificado_agencia})
    return breach


@router.get("/breaches/{id}/notification-form")
def download_breach_notification_form(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    breach = db.query(SecurityBreach).filter(SecurityBreach.id == id).first()
    if not breach:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
        
    form = "# FORMULARIO OFICIAL DE NOTIFICACIÓN DE BRECHA DE SEGURIDAD\n"
    form += "### A la Agencia Nacional de Protección de Datos Personales (Chile)\n"
    form += f"**Código de Incidente Institucional:** {breach.codigo_incidente}\n"
    form += f"**Fecha de Detección:** {breach.fecha_deteccion.strftime('%d/%m/%Y %H:%M:%S')}\n"
    form += f"**Plazo Legal Máximo (72 Horas):** {breach.fecha_limite_notificacion.strftime('%d/%m/%Y %H:%M:%S')}\n"
    form += f"**Gravedad Estimada:** {breach.gravedad.upper()}\n\n"
    form += "---\n\n"
    form += "### 1. Datos del Responsable del Tratamiento\n"
    form += "- **Organismo:** Servicio Público de la Administración del Estado de Chile\n"
    form += "- **Contacto DPO:** Encargado/a de Protección de Datos (dpo@protecciondatos.cl)\n\n"
    form += "### 2. Naturaleza y Tipología del Incidente\n"
    form += f"- **Categoría:** {breach.tipo_incidente}\n"
    form += f"- **Descripción de los Hechos:**\n> {breach.descripcion}\n\n"
    form += "### 3. Datos Personales Comprometidos y Titulares Afectados\n"
    form += f"- **Categorías de Datos Afectados:** {breach.datos_afectados}\n"
    form += f"- **Número Estimado de Titulares Afectados:** {breach.cantidad_titulares_afectados:,} personas\n\n"
    form += "### 4. Medidas Técnicas de Contención y Mitigación Adoptadas\n"
    if breach.medidas_contencion:
        form += f"{breach.medidas_contencion}\n\n"
    else:
        form += "Se procedió al aislamiento de servidores comprometidos, revocación masiva de credenciales y activación del comité de crisis de ciberseguridad.\n\n"
    form += "### 5. Notificación a los Titulares Afectados\n"
    form += f"- **¿Se ha notificado a los titulares?:** {'Sí, mediante comunicación directa' if breach.notificado_titulares else 'En evaluación según el nivel de riesgo para sus derechos'}\n\n"
    form += "---\n"
    form += "*Documento generado para cumplimiento del deber de notificación en virtud de la Ley 21.719.*"

    headers = {"Content-Disposition": f"attachment; filename=Notificacion_Agencia_{breach.codigo_incidente}.md"}
    return StreamingResponse(io.BytesIO(form.encode("utf-8")), media_type="text/markdown", headers=headers)
