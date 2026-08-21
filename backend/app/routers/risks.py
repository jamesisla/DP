import io
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import Area, ImpactAssessment, MatrizLevantamiento, Riesgo, User
from app.schemas.domain import ImpactAssessmentCreate, ImpactAssessmentRead, RiesgoRead

router = APIRouter(tags=["Riesgos y Evaluaciones de Impacto"])


@router.get("/risks", response_model=list[RiesgoRead])
def get_risks(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(Riesgo).order_by(Riesgo.puntuacion.desc()).all()


@router.get("/risks/heatmap")
def get_heatmap(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    areas = db.query(Area).all()
    res = []
    for a in areas:
        critico = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Crítico").count()
        alto = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Alto").count()
        medio = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Medio").count()
        bajo = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.nivel == "Bajo").count()
        requiere_eipd = db.query(Riesgo).join(MatrizLevantamiento).filter(MatrizLevantamiento.area_id == a.id, Riesgo.requiere_eipd.is_(True)).count()
        
        res.append({
            "area": a.nombre,
            "Crítico": critico,
            "Alto": alto,
            "Medio": medio,
            "Bajo": bajo,
            "requiere_eipd": requiere_eipd
        })
    return res


@router.get("/risks/report")
def get_risks_report(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    risks = db.query(Riesgo).order_by(Riesgo.puntuacion.desc()).all()
    
    report = "# INFORME OFICIAL DE HALLAZGOS Y ANÁLISIS DE RIESGOS - LEY 21.719\n"
    report += f"**Fecha de Emisión:** {datetime.now().strftime('%d/%m/%Y %H:%M')}\n"
    report += "**Organismo Responsable:** Servicio Público de la Administración del Estado de Chile\n"
    report += "**Metodología:** Matriz Probabilidad (1-5) × Impacto (1-5) según Anexo Metodológico Ley 21.719\n\n"
    report += "---\n\n"
    report += "## 1. Resumen Ejecutivo\n"
    report += "El presente informe técnico consolida el diagnóstico de riesgos, brechas de cumplimiento e identificación de tratamientos que requieren una Evaluación de Impacto en Protección de Datos (EIPD).\n\n"
    
    report += "## 2. Mapa y Detalle de Tratamientos Evaluados\n\n"
    for r in risks:
        eipd_flag = "⚠️ **REQUIERE EVALUACIÓN DE IMPACTO (EIPD)**" if r.requiere_eipd else "Tratamiento estándar"
        report += f"### [{r.nivel.upper()}] Puntuación: {r.puntuacion}/25 (Probabilidad: {r.probabilidad}, Impacto: {r.impacto})\n"
        report += f"- **Categoría de Riesgo:** {eipd_flag}\n"
        report += f"- **Hallazgo Identificado:** {r.descripcion}\n"
        report += "- **Medida Recomendada:** "
        if r.nivel in ["Crítico", "Alto"]:
            report += "Formalizar Acuerdos de Transferencia Internacional (DPA) inmediatos, cifrado de extremo a extremo y auditoría semestral.\n\n"
        elif r.nivel == "Medio":
            report += "Revisar políticas de consentimiento expreso, limitar accesos por rol y registrar bitácora de transacciones.\n\n"
        else:
            report += "Mantener controles de accesos lógicos y actualización periódica de inventario.\n\n"

    report += "---\n"
    report += "*Emitido conforme al estándar de rendición de cuentas de la Ley 21.719.*"

    headers = {"Content-Disposition": "attachment; filename=Informe_Hallazgos_Riesgos_Ley21719.md"}
    return StreamingResponse(io.BytesIO(report.encode("utf-8")), media_type="text/markdown", headers=headers)


# DPIA / EIPD Endpoints
@router.get("/impact-assessments", response_model=list[ImpactAssessmentRead])
def get_impact_assessments(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(ImpactAssessment).order_by(ImpactAssessment.id.desc()).all()


@router.post("/impact-assessments", response_model=ImpactAssessmentRead, status_code=status.HTTP_201_CREATED)
def create_impact_assessment(
    payload: ImpactAssessmentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    eipd = ImpactAssessment(**payload.model_dump())
    db.add(eipd)
    db.commit()
    db.refresh(eipd)
    log_action(db, current_user.id, "Crear Evaluación de Impacto (EIPD)", "ImpactAssessment", {"id": eipd.id, "titulo": eipd.titulo})
    return eipd


# ==============================================================================
# SIMULADOR DE EXPOSICIÓN A SANCIONES Y MULTAS (ART. 50 Y 51 LEY 21.719)
# ==============================================================================

@router.get("/fines-simulator")
def get_fines_simulator_data(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Calculadora y modelo de exposición a sanciones administrativas en UTM y CLP."""
    utm_value_clp = 66000 # Valor referencial UTM

    scenarios = [
        {
            "id": "leve",
            "categoria": "Infracción Leve",
            "articulo": "Art. 49 Ley 21.719",
            "multa_max_utm": 5000,
            "multa_max_clp": 5000 * utm_value_clp,
            "ejemplos": [
                "Deficiencias formales en el Registro de Actividades de Tratamiento (RAT)",
                "Falta de claridad en las políticas de cookies no esenciales",
                "Retrasos leves sin dolo en la respuesta a requerimientos no vinculantes"
            ],
            "nivel_gravedad": "Bajo / Advertencia"
        },
        {
            "id": "grave",
            "categoria": "Infracción Grave",
            "articulo": "Art. 50 Ley 21.719",
            "multa_max_utm": 10000,
            "multa_max_clp": 10000 * utm_value_clp,
            "ejemplos": [
                "Tratamiento de datos personales sin base de licitud acreditada (Art. 13)",
                "No notificar una brecha de seguridad a la Agencia en el plazo de 72 horas (Art. 18)",
                "Vencimiento sistemático del plazo de 15 días hábiles para atender derechos ARCO+",
                "No contar con contratos DPA formalizados con encargados externos (Art. 16)"
            ],
            "nivel_gravedad": "Alto / Sanción Financiera Significativa"
        },
        {
            "id": "gravisima",
            "categoria": "Infracción Gravísima",
            "articulo": "Art. 51 Ley 21.719",
            "multa_max_utm": 20000,
            "multa_max_clp": 20000 * utm_value_clp,
            "ejemplos": [
                "Tratamiento ilícito de datos sensibles (salud, biométricos, opiniones políticas)",
                "Transferencias internacionales a paraísos sin garantías mínimas de protección",
                "Reincidencia reiterada o desacato a medidas cautelares de la Agencia"
            ],
            "nivel_gravedad": "Crítico / Sanción Máxima (Hasta 20.000 UTM o 4% ingresos)"
        }
    ]

    atenuantes = [
        {"id": "dpo", "nombre": "Nombramiento y operación efectiva del DPO (Art. 24)", "descuento_porcentaje": 20},
        {"id": "compliance", "nombre": "Programa de cumplimiento y RAT consolidado (LexApp GRC)", "descuento_porcentaje": 30},
        {"id": "cooperacion", "nombre": "Cooperación proactiva y notificación inmediata ante brechas", "descuento_porcentaje": 25},
        {"id": "hardening", "nombre": "Medidas de seguridad técnicas (MFA, Cifrado TLS 1.3/AES-256)", "descuento_porcentaje": 15}
    ]

    return {
        "valor_utm_clp": utm_value_clp,
        "escenarios": scenarios,
        "atenuantes_legales": atenuantes
    }

