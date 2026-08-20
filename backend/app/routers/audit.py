import io
import json
import zipfile
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user
from app.models.domain import (
    ArcoRequest,
    Documento,
    LogAuditoria,
    MatrizLevantamiento,
    Proveedor,
    Riesgo,
    SecurityBreach,
    User,
)
from app.schemas.domain import LogAuditoriaRead

router = APIRouter(tags=["Auditoría y Evidencias"])


@router.get("/audit-logs", response_model=list[LogAuditoriaRead])
def get_audit_logs(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.desc()).all()


@router.get("/evidence-zip")
def download_evidence_zip(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Fase 1
        zip_file.writestr(
            "Fase_1_Primeros_Pasos/Acta_Designacion_DPO.txt", 
            "Acta de designación formal de Encargado de Protección de Datos (DPO) conforme al Art. 49 de la Ley 21.719."
        )
        
        # Fase 2: Matriz
        matrices = db.query(MatrizLevantamiento).all()
        matrix_rows = []
        for m in matrices:
            area_name = m.area.nombre if m.area else "Área"
            matrix_rows.append(f"=== División: {area_name} (Finalizada: {m.completada}) ===")
            matrix_rows.append(json.dumps(m.datos_json, indent=2, ensure_ascii=False))
            matrix_rows.append("\n" + "="*50 + "\n")
        
        zip_file.writestr(
            "Fase_2_Levantamiento/Matriz_Maestra_Consolidada.txt", 
            "\n".join(matrix_rows) if matrix_rows else "No hay matrices levantadas."
        )
        
        # Fase 3: Riesgos
        risks = db.query(Riesgo).all()
        risk_lines = ["# REPORTE DE BRECHAS Y ANÁLISIS DE RIESGOS 5x5"]
        for r in risks:
            risk_lines.append(f"- [{r.nivel}] Puntuación {r.puntuacion}/25 (Prob: {r.probabilidad}, Imp: {r.impacto}): {r.descripcion}")
        zip_file.writestr(
            "Fase_3_Analisis/Informe_Riesgos_Consolidado.txt", 
            "\n".join(risk_lines)
        )
        
        # Fase 4 & 5: Documentos
        docs = db.query(Documento).all()
        for d in docs:
            folder = "Fase_4_Catalogo" if d.tipo == "catalogo" else "Fase_5_Politica"
            zip_file.writestr(
                f"{folder}/Documento_{d.tipo}_v{d.version}.txt",
                d.contenido
            )
            
            if d.estado in ["aprobado", "firmado"]:
                zip_file.writestr(
                    f"{folder}/Acta_Aprobacion_{d.tipo}.txt",
                    f"Documento {d.tipo} aprobado con actas de firmas electrónicas registradas."
                )

        # Fase 6: Solicitudes ARCO y Brechas
        arcos = db.query(ArcoRequest).all()
        arco_lines = ["# REGISTRO DE SOLICITUDES DE DERECHOS ARCO+ (15 DÍAS)"]
        for a in arcos:
            arco_lines.append(f"- Folio: {a.folio} | Titular: {a.titular_nombre} | Derecho: {a.tipo_derecho} | Estado: {a.estado} | Límite: {a.fecha_limite_legal}")
        zip_file.writestr("Fase_6_Protocolos/Registro_Solicitudes_ARCO.txt", "\n".join(arco_lines))

        breaches = db.query(SecurityBreach).all()
        breach_lines = ["# REGISTRO DE BRECHAS DE SEGURIDAD (72 HORAS)"]
        for b in breaches:
            breach_lines.append(f"- Código: {b.codigo_incidente} | Tipo: {b.tipo_incidente} | Gravedad: {b.gravedad} | Notificado Agencia: {b.notificado_agencia} | Estado: {b.estado}")
        zip_file.writestr("Fase_6_Protocolos/Registro_Brechas_Seguridad.txt", "\n".join(breach_lines))

        # Proveedores
        provs = db.query(Proveedor).all()
        prov_lines = ["# REGISTRO DE ENCARGADOS Y PROVEEDORES"]
        for p in provs:
            prov_lines.append(f"- Proveedor: {p.nombre} (RUT: {p.rut}) | Servicio: {p.servicio} | Vigencia: {p.fecha_contrato_inicio} al {p.fecha_contrato_fin}")
        zip_file.writestr("Terceros_Proveedores/Registro_Proveedores.txt", "\n".join(prov_lines))

        # Audit Logs
        logs = db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.asc()).all()
        log_lines = ["ID | Fecha Hora | Funcionario | Acción Realizada | Entidad Afectada"]
        for l in logs:
            uname = l.usuario.full_name if l.usuario else "Sistema"
            log_lines.append(f"{l.id} | {l.fecha_hora.isoformat()} | {uname} | {l.accion} | {l.entidad_afectada}")
        zip_file.writestr(
            "Auditoria_Trazabilidad/Bitacora_Completa_Logs.txt",
            "\n".join(log_lines)
        )
        
    zip_buffer.seek(0)
    headers = {"Content-Disposition": "attachment; filename=Expediente_Evidencias_SIGE_DP_Ley21719.zip"}
    return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)
