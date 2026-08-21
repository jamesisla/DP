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
        
    annex = "# CONTRATO DE ENCARGADO DE TRATAMIENTO (DPA) Y CLÁUSULA CIBERSEGURIDAD ANCI\n"
    annex += "### Cumplimiento Unificado: Ley N° 21.719 (Datos Personales) y Ley N° 21.663 (ANCI)\n\n"
    annex += f"**Institución Contratante:** Servicio Público del Estado de Chile\n"
    annex += f"**Proveedor / Encargado Externo:** {prov.nombre}\n"
    annex += f"**RUT:** {prov.rut}\n"
    annex += f"**Servicio Contratado:** {prov.servicio}\n"
    annex += f"**País de Alojamiento / Servidores:** {prov.pais_alojamiento}\n"
    annex += f"**Criticidad Ciberseguridad (Supply Chain):** {prov.criticidad_ciber.upper()}\n"
    annex += f"**Vigencia Contractual:** Desde {prov.fecha_contrato_inicio.strftime('%d/%m/%Y')} hasta {prov.fecha_contrato_fin.strftime('%d/%m/%Y')}\n\n"
    annex += "---\n\n"
    annex += "### 1. Objeto y Calidad del Tratamiento (Art. 16 Ley 21.719)\n"
    annex += f"El Proveedor actuará en calidad de **Encargado del Tratamiento**, procesando datos exclusivamente para los fines estipulados en el contrato principal y conforme a las directrices de seguridad de la Institución.\n\n"
    annex += "### 2. Cláusula Obligatoria de Notificación Rápida a la ANCI (Art. 8 Ley 21.663)\n"
    annex += f"- **SLA de Alerta de Incidentes:** En caso de sufrir un ataque cibernético, intrusión, fuga de datos o compromiso de credenciales, el Proveedor está obligado por ley a notificar al CISO institucional en un plazo no superior a **{prov.sla_notificacion_horas} horas**.\n"
    annex += "- El Proveedor deberá remitir los Indicadores de Compromiso (IoCs) y colaborar en la preservación de la cadena de custodia forense.\n\n"
    annex += "### 3. Medidas Técnicas Mínimas de Seguridad\n"
    annex += "1. **Autenticación Multifactor (MFA):** Obligatorio para todos los operadores del proveedor que administren infraestructura institucional.\n"
    annex += "2. **Cifrado Fuerte:** Cifrado de bases de datos mediante AES-256 y canales cifrados TLS 1.3.\n"
    annex += "3. **Destrucción Segura de Datos:** Supresión certificada de datos personales al finalizar la relación contractual.\n\n"
    annex += "### 4. Aceptación y Firma Legal\n"
    annex += f"Firmado electrónicamente por el Representante Legal de **{prov.nombre}** y el Responsable Institucional de Ciberseguridad.\n"

    headers = {"Content-Disposition": f"attachment; filename=Anexo_DPA_ANCI_{prov.nombre.replace(' ', '_')}.md"}
    return StreamingResponse(io.BytesIO(annex.encode("utf-8")), media_type="text/markdown", headers=headers)
