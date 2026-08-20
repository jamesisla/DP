import io
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import add_business_days, calculate_business_days_remaining, get_current_user, log_action
from app.models.domain import ArcoRequest, User
from app.schemas.domain import ArcoRequestCreate, ArcoRequestRead, ArcoRequestUpdate

router = APIRouter(tags=["Derechos ARCO+ (15 Días)"])


@router.get("/arco", response_model=list[ArcoRequestRead])
def get_arco_requests(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(ArcoRequest).order_by(ArcoRequest.fecha_limite_legal.asc()).all()


@router.get("/arco/{id}", response_model=ArcoRequestRead)
def get_arco_request(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    req = db.query(ArcoRequest).filter(ArcoRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud ARCO+ no encontrada")
    return req


@router.post("/arco", response_model=ArcoRequestRead, status_code=status.HTTP_201_CREATED)
def create_arco_request(
    payload: ArcoRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    today = date.today()
    # Calculate 15 business days legal deadline
    legal_deadline = add_business_days(today, 15)
    
    # Auto-generate Folio
    count = db.query(ArcoRequest).count() + 1
    folio = f"ARCO-{today.year}-{str(count).zfill(4)}"
    
    arco = ArcoRequest(
        folio=folio,
        tipo_derecho=payload.tipo_derecho,
        titular_nombre=payload.titular_nombre,
        titular_rut=payload.titular_rut,
        titular_email=payload.titular_email,
        fecha_ingreso=today,
        dias_habiles_limite=15,
        fecha_limite_legal=legal_deadline,
        estado="Ingresada",
        descripcion_solicitud=payload.descripcion_solicitud,
        area_derivada_id=payload.area_derivada_id,
        responsable_asignado_id=payload.responsable_asignado_id or current_user.id
    )
    
    db.add(arco)
    db.commit()
    db.refresh(arco)
    
    log_action(db, current_user.id, "Ingresar Solicitud ARCO+", "ArcoRequest", {"folio": arco.folio, "tipo": arco.tipo_derecho, "titular": arco.titular_nombre})
    return arco


@router.put("/arco/{id}", response_model=ArcoRequestRead)
def update_arco_request(
    id: int,
    payload: ArcoRequestUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    arco = db.query(ArcoRequest).filter(ArcoRequest.id == id).first()
    if not arco:
        raise HTTPException(status_code=404, detail="Solicitud ARCO+ no encontrada")
        
    old_state = arco.estado
    arco.estado = payload.estado
    arco.fundamento_respuesta = payload.fundamento_respuesta
    if payload.area_derivada_id is not None:
        arco.area_derivada_id = payload.area_derivada_id
    if payload.responsable_asignado_id is not None:
        arco.responsable_asignado_id = payload.responsable_asignado_id
        
    db.commit()
    db.refresh(arco)
    
    log_action(db, current_user.id, "Actualizar Solicitud ARCO+", "ArcoRequest", {"folio": arco.folio, "anterior": old_state, "nuevo": arco.estado})
    return arco


@router.get("/arco/{id}/oficio")
def download_arco_response_letter(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    arco = db.query(ArcoRequest).filter(ArcoRequest.id == id).first()
    if not arco:
        raise HTTPException(status_code=404, detail="Solicitud ARCO+ no encontrada")
        
    days_rem = calculate_business_days_remaining(arco.fecha_limite_legal)
    
    doc = "# OFICIO DE RESOLUCIÓN DE SOLICITUD DE DERECHOS ARCO+\n"
    doc += f"**Folio:** {arco.folio}\n"
    doc += f"**Fecha:** {datetime.now().strftime('%d/%m/%Y')}\n"
    doc += "**Materia:** Respuesta formal a ejercicio de derecho bajo Ley N° 21.719\n\n"
    doc += "---\n\n"
    doc += f"**A:** {arco.titular_nombre} (RUT: {arco.titular_rut})\n"
    doc += f"**Correo de Notificación:** {arco.titular_email}\n"
    doc += f"**De:** Delegado/a de Protección de Datos (DPO) - Servicio Público\n\n"
    doc += "### 1. Antecedentes de la Solicitud\n"
    doc += f"Con fecha **{arco.fecha_ingreso.strftime('%d/%m/%Y')}**, se recepcionó la solicitud de ejercicio del derecho de **{arco.tipo_derecho.upper()}**, en la cual se expone:\n"
    doc += f"> \"{arco.descripcion_solicitud}\"\n\n"
    doc += "### 2. Resolución y Fundamentos Jurídicos\n"
    doc += f"Estado de la resolución: **{arco.estado.upper()}**\n\n"
    if arco.fundamento_respuesta:
        doc += f"{arco.fundamento_respuesta}\n\n"
    else:
        doc += "Se ha verificado la procedencia legal del requerimiento y se han adoptado las medidas técnicas pertinentes para dar cabal cumplimiento a su derecho garantizado por el Art. 5 y siguientes de la Ley 21.719.\n\n"
    doc += "### 3. Vías de Reclamación\n"
    doc += "Se informa al titular que, en caso de disconformidad con la presente resolución, podrá interponer la correspondiente acción de amparo ante la Agencia Nacional de Protección de Datos Personales dentro del plazo legal.\n\n"
    doc += "---\n"
    doc += "*Firma Electrónica Avanzada / DPO Institucional*"

    headers = {"Content-Disposition": f"attachment; filename=Oficio_Respuesta_{arco.folio}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)
