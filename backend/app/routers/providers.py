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


@router.get("/proveedores/{id}/scc-agreement")
def get_proveedor_scc_agreement(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Genera el Acuerdo de Transferencia Internacional con Cláusulas Contractuales Tipo (SCC - Art. 28 Ley 21.719)."""
    prov = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    doc = f"""# ACUERDO DE TRANSFERENCIA INTERNACIONAL DE DATOS PERSONALES
## CLÁUSULAS CONTRACTUALES TIPO (SCC) CONFORME AL ARTÍCULO 28 DE LA LEY N° 21.719

**Exportador de Datos (Responsable):** Servicio Público del Estado de Chile  
**Importador de Datos (Encargado/Subencargado):** {prov.nombre}  
**RUT / Identificador Internacional:** {prov.rut}  
**País de Destino / Alojamiento:** {prov.pais_alojamiento}  
**Mecanismo de Transferencia Habilitante:** {prov.mecanismo_transferencia}  
**Nivel de Garantía Declarado:** {prov.nivel_garantia_pais}  

---

### CLÁUSULA PRIMERA: OBJETO Y ALCANCE
El presente acuerdo regula el flujo transfronterizo de datos personales derivado de la contratación de los servicios de **{prov.servicio}**, asegurando un nivel de protección sustancialmente equivalente al exigido por la Ley N° 21.719 de la República de Chile.

### CLÁUSULA SEGUNDA: OBLIGACIONES DEL IMPORTADOR DE DATOS
1. **Principio de Finalidad Restringida:** El Importador no podrá utilizar los datos transferidos para finalidades distintas a la prestación del servicio encomendado.
2. **Prohibición de Transferencias Ulteriores:** Se prohíbe la subcontratación o reenvío de datos a terceros países u otras entidades sin autorización previa por escrito del Exportador.
3. **Sometimiento a la Jurisdicción de la Agencia de Datos:** El Importador acepta expresamente la competencia fiscalizadora y sancionatoria de la Agencia Nacional de Protección de Datos Personales de Chile.
4. **Ejercicio de Derechos ARCO+:** El Importador cooperará de inmediato con el Exportador para hacer efectivos los derechos de acceso, rectificación, cancelación, oposición, portabilidad y bloqueo de los titulares en el plazo legal de 15 días hábiles.

### CLÁUSULA TERCERA: SALVAGUARDAS TÉCNICAS Y ENCRIPTACIÓN
- Cifrado en tránsito (TLS 1.3) y en reposo (AES-256 con claves gestionadas por el Exportador).
- Restricción de acceso lógico y registros de auditoría inmutables.
- Supresión certificada de datos e imágenes forenses al término del servicio.

_____________________________________          _____________________________________
**Por el Exportador de Datos**                 **Por el Importador de Datos**
*Delegado/a de Protección de Datos (DPO)*      *Representante Legal {prov.nombre}*
"""

    headers = {"Content-Disposition": f"attachment; filename=Acuerdo_Transferencia_SCC_{prov.nombre.replace(' ', '_')}.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


@router.get("/proveedores/international-transfers/summary")
def get_international_transfers_summary(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Resumen consolidado del inventario de transferencias transfronterizas (Art. 28)."""
    provs = db.query(Proveedor).all()
    transfers = []
    
    for p in provs:
        is_intl = p.pais_alojamiento.lower() not in ["chile", "local", "on-premise"]
        transfers.append({
            "proveedor_id": p.id,
            "proveedor_nombre": p.nombre,
            "servicio": p.servicio,
            "pais_destino": p.pais_alojamiento,
            "es_internacional": is_intl,
            "mecanismo_transferencia": p.mecanismo_transferencia if is_intl else "Tratamiento Nacional (In-country)",
            "nivel_garantia": p.nivel_garantia_pais if is_intl else "Territorio Nacional",
            "dpa_firmado": p.dpa_firmado,
            "criticidad": p.criticidad_ciber
        })
    return transfers
