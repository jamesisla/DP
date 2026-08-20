import io
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import Proveedor, User
from app.schemas.domain import ProveedorCreate, ProveedorRead

router = APIRouter(tags=["Proveedores y Encargados Externos"])


@router.get("/proveedores", response_model=list[ProveedorRead])
def get_proveedores(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Proveedor).order_by(Proveedor.id.asc()).all()


@router.post("/proveedores", response_model=ProveedorRead, status_code=status.HTTP_201_CREATED)
def create_proveedor(
    payload: ProveedorCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    prov = Proveedor(**payload.model_dump())
    db.add(prov)
    db.commit()
    db.refresh(prov)
    log_action(db, current_user.id, "Registrar Proveedor", "Proveedor", {"id": prov.id, "nombre": prov.nombre})
    return prov


@router.delete("/proveedores/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proveedor(
    id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    prov = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    log_action(db, current_user.id, "Eliminar Proveedor", "Proveedor", {"id": prov.id, "nombre": prov.nombre})
    db.delete(prov)
    db.commit()
    return None


@router.get("/proveedores/{id}/annex")
def get_proveedor_annex(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    prov = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    annex = "# ANEXO REGULATORIO DE PROTECCIÓN DE DATOS PERSONALES\n"
    annex += "### Cláusulas Contractuales Obligatorias - Ley N° 21.719 de Chile\n\n"
    annex += f"**Institución Contratante:** Servicio Público del Estado de Chile\n"
    annex += f"**Proveedor / Encargado de Tratamiento:** {prov.nombre}\n"
    annex += f"**RUT Proveedor:** {prov.rut}\n"
    annex += f"**Servicio Contratado:** {prov.servicio}\n"
    annex += f"**Vigencia Contractual:** Desde {prov.fecha_contrato_inicio.strftime('%d/%m/%Y')} hasta {prov.fecha_contrato_fin.strftime('%d/%m/%Y')}\n\n"
    annex += "---\n\n"
    annex += "### 1. Objeto y Calidad del Tratamiento\n"
    annex += f"El Proveedor tratará datos personales únicamente por cuenta e instrucción exclusiva de la Institución en calidad de **Encargado del Tratamiento** (Art. 2 letra e de la Ley 21.719), absteniéndose de utilizarlos para finalidades propias o transferirlos a terceros sin autorización previa por escrito.\n\n"
    annex += "### 2. Obligaciones y Medidas de Seguridad\n"
    annex += "1. Implementar medidas técnicas y organizativas de seguridad (cifrado en tránsito y reposo, control de accesos privilegiados y trazabilidad de logs).\n"
    annex += "2. **Notificación de Brechas de Seguridad:** El Proveedor deberá notificar a la Institución cualquier incidente de seguridad que comprometa datos personales en un plazo máximo e improrrogable de **24 horas** tras su detección.\n"
    annex += "3. **Destrucción o Devolución:** Al término del contrato, el Proveedor procederá a la supresión o restitución íntegra de todos los datos personales y copias existentes.\n\n"
    annex += "### 3. Declaración de Conformidad y Firma\n"
    annex += f"Representante Legal de {prov.nombre} firma en señal de aceptación de las obligaciones aquí descritas.\n"

    headers = {"Content-Disposition": f"attachment; filename=Anexo_Proteccion_Datos_{prov.nombre.replace(' ', '_')}.md"}
    return StreamingResponse(io.BytesIO(annex.encode("utf-8")), media_type="text/markdown", headers=headers)
