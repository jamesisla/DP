import io
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import TrainingCampaign, User
from app.schemas.domain import TrainingCampaignCreate, TrainingCampaignRead

router = APIRouter(prefix="/training", tags=["Capacitación & Concientización (Art. 14 L21.719 / Art. 8 L21.663)"])


@router.get("/campaigns", response_model=list[TrainingCampaignRead])
def get_training_campaigns(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Listado de campañas de capacitación y concientización institucional."""
    return db.query(TrainingCampaign).order_by(TrainingCampaign.id.desc()).all()


@router.post("/campaigns", response_model=TrainingCampaignRead, status_code=status.HTTP_201_CREATED)
def create_training_campaign(
    payload: TrainingCampaignCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Registrar nueva campaña de capacitación o phishing simulado."""
    camp = TrainingCampaign(
        titulo=payload.titulo,
        tipo=payload.tipo,
        descripcion=payload.descripcion,
        fecha_inicio=payload.fecha_inicio,
        fecha_fin=payload.fecha_fin,
        total_convocados=payload.total_convocados,
        total_capacitados=payload.total_capacitados,
        porcentaje_aprobacion=payload.porcentaje_aprobacion,
        tasa_clic_phishing=payload.tasa_clic_phishing,
        estado=payload.estado,
        instructor_o_plataforma=payload.instructor_o_plataforma,
        area_responsable_id=payload.area_responsable_id
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    log_action(db, current_user.id, "Crear Campaña Capacitación", "TrainingCampaign", {"id": camp.id, "titulo": camp.titulo})
    return camp


@router.delete("/campaigns/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_campaign(
    id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Eliminar registro de campaña."""
    camp = db.query(TrainingCampaign).filter(TrainingCampaign.id == id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

    db.delete(camp)
    db.commit()
    log_action(db, current_user.id, "Eliminar Campaña Capacitación", "TrainingCampaign", {"id": id})
    return None


@router.get("/campaigns/{id}/certificate")
def download_training_certificate(
    id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Generador del Certificado Oficial y Acta de Capacitación Institucional."""
    camp = db.query(TrainingCampaign).filter(TrainingCampaign.id == id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

    cobertura = int((camp.total_capacitados / camp.total_convocados) * 100) if camp.total_convocados > 0 else 0

    doc = f"""# ACTA Y CERTIFICADO DE CAPACITACIÓN INSTITUCIONAL
## DEBER DE CAPACITACIÓN Y CONCIENTIZACIÓN EN CIBERSEGURIDAD Y DATOS PERSONALES
**Marco Legal:** Art. 14 Ley N° 21.719 & Art. 8 letra f Ley N° 21.663 (ANCI)
**Organismo:** Servicio Público del Estado de Chile
**Fecha de Emisión:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}

---

### 1. ANTECEDENTES DE LA CAMPAÑA FORMATIVA
- **Título de la Actividad:** {camp.titulo}
- **Eje Temático:** {camp.tipo}
- **Período de Ejecución:** Del {camp.fecha_inicio.strftime('%d/%m/%Y')} al {camp.fecha_fin.strftime('%d/%m/%Y')}
- **Instructor / Plataforma:** {camp.instructor_o_plataforma}
- **Estado de la Actividad:** {camp.estado.upper()}

---

### 2. RESULTADOS Y MÉTRICAS DE COBERTURA
- **Total de Funcionarios Convocados:** {camp.total_convocados} personas
- **Total de Funcionarios Capacitados:** {camp.total_capacitados} personas
- **Porcentaje de Cobertura Institucional:** {cobertura}%
- **Tasa de Aprobación en Evaluaciones:** {camp.porcentaje_aprobacion}%
"""
    if "Phishing" in camp.tipo:
        doc += f"- **Tasa de Clic en Phishing Simulado (Vulnerabilidad):** {camp.tasa_clic_phishing}%\n"

    doc += f"""
---

### 3. OBJETIVOS Y CONTENIDOS IMPARTIDOS
{camp.descripcion or "Capacitación orientada a robustecer la cultura de seguridad, buenas prácticas en el manejo de datos confidenciales y detección oportuna de amenazas digitales."}

---

### 4. ACREDITACIÓN DE CUMPLIMIENTO REGULATORIO
Se certifica que la presente actividad formativa cumple con las exigencias de capacitación obligatoria exigidas por la Agencia Nacional de Ciberseguridad (ANCI) y los principios de responsabilidad proactiva de la Ley de Protección de Datos Personales.

---
*Emitido por LexApp GRC · Registro inmutable para auditorías de la Contraloría General y la ANCI.*
"""
    headers = {"Content-Disposition": f"attachment; filename=Certificado_Capacitacion_{camp.id}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)
