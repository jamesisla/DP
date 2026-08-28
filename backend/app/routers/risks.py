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


# DPIA / EIPD Endpoints (Art. 25 Ley N° 21.719)
@router.get("/impact-assessments", response_model=list[ImpactAssessmentRead])
def get_impact_assessments(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    # Auto-seed if empty
    if db.query(ImpactAssessment).count() == 0:
        area_ti = db.query(Area).filter(Area.nombre.ilike("%Tecnolog%")).first() or db.query(Area).first()
        area_gab = db.query(Area).filter(Area.nombre.ilike("%Gabinete%")).first() or db.query(Area).first()
        
        area_ti_id = area_ti.id if area_ti else 1
        area_gab_id = area_gab.id if area_gab else 1

        sample_eipds = [
            ImpactAssessment(
                titulo="EIPD-01: Sistema Biométrico Facial y Control de Acceso Perimetral",
                area_id=area_ti_id,
                descripcion_tratamiento="Captura y comparación de patrones biométricos faciales en torniquetes de acceso a dependencias institucionales.",
                base_licitud="Obligación Legal e Interés Público (Art. 13)",
                criterios_alto_riesgo_json=[
                    "Tratamiento de datos sensibles o categorías especiales (Datos biométricos)",
                    "Tratamiento a gran escala de funcionarios y visitas",
                    "Observación o monitoreo sistemático de accesos"
                ],
                analisis_necesidad="El control biométrico es estrictamente necesario para garantizar la seguridad de recintos con infraestructura crítica de información (RSIC).",
                riesgos_derechos="Riesgo de suplantación o fuga de plantillas biométricas que vulneren la privacidad e identidad de los titulares.",
                medidas_mitigacion="Cifrado AES-256 de templates en reposo, hashing unidireccional no reversible, prohibición de transferencias a terceros y retención máxima de 30 días de logs.",
                riesgo_residual="Aceptable / Bajo",
                opinion_dpo="El tratamiento cuenta con salvaguardas técnicas suficientes. Se aprueba formalmente la implementación bajo supervisión del DPO.",
                estado="Aprobado con Mitigaciones",
                dpo_aprobado=True,
                hash_integridad="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            ),
            ImpactAssessment(
                titulo="EIPD-02: Plataforma de Tramitación Ciudadana con Perfilamiento Predictivo",
                area_id=area_gab_id,
                descripcion_tratamiento="Algoritmo de priorización de requerimientos ciudadanos basado en vulnerabilidad socioeconómica y tiempo de espera.",
                base_licitud="Misión de Interés Público (Art. 13)",
                criterios_alto_riesgo_json=[
                    "Evaluación o puntuación / Perfilamiento de personas",
                    "Toma de decisiones automatizadas o semiautomatizadas",
                    "Datos relativos a colectivos o sujetos vulnerables"
                ],
                analisis_necesidad="Optimizar la asignación de recursos y tiempos de respuesta en beneficio de la ciudadanía.",
                riesgos_derechos="Sesgos algorítmicos que generen discriminación arbitraria en la asignación de prioridades de atención.",
                medidas_mitigacion="Supervisión humana obligatoria ('Human-in-the-loop'), auditorías semestrales de sesgo, derecho a impugnación y explicación algorítmica para el ciudadano.",
                riesgo_residual="Aceptable / Bajo",
                opinion_dpo="Dictamen favorable condicionado a la incorporación del canal de impugnación ciudadana presencial y digital.",
                estado="Aprobado con Mitigaciones",
                dpo_aprobado=True,
                hash_integridad="f4a1c55298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c966"
            )
        ]
        db.add_all(sample_eipds)
        db.commit()

    return db.query(ImpactAssessment).order_by(ImpactAssessment.id.desc()).all()


@router.post("/impact-assessments", response_model=ImpactAssessmentRead, status_code=status.HTTP_201_CREATED)
def create_impact_assessment(
    payload: ImpactAssessmentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    import hashlib
    data = payload.model_dump()
    raw = f"{data['titulo']}-{data['area_id']}-{datetime.now().isoformat()}"
    h = hashlib.sha256(raw.encode()).hexdigest()
    data["hash_integridad"] = h
    
    eipd = ImpactAssessment(**data)
    db.add(eipd)
    db.commit()
    db.refresh(eipd)
    log_action(db, current_user.id, "Crear Evaluación de Impacto (EIPD)", "ImpactAssessment", {"id": eipd.id, "titulo": eipd.titulo})
    return eipd


@router.post("/impact-assessments/{assessment_id}/approve")
def approve_impact_assessment(
    assessment_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    import hashlib
    eipd = db.query(ImpactAssessment).filter(ImpactAssessment.id == assessment_id).first()
    if not eipd:
        raise HTTPException(status_code=404, detail="Evaluación EIPD no encontrada")
    
    eipd.estado = "Aprobado con Mitigaciones"
    eipd.dpo_aprobado = True
    eipd.hash_integridad = hashlib.sha256(f"EIPD-{eipd.id}-{eipd.titulo}-{datetime.now().isoformat()}".encode()).hexdigest()
    db.commit()
    db.refresh(eipd)

    log_action(db, current_user.id, "Aprobar Dictamen EIPD / DPIA", "ImpactAssessment", {"id": eipd.id, "hash": eipd.hash_integridad})
    return {"message": "EIPD aprobada con dictamen favorable del DPO", "hash_integridad": eipd.hash_integridad, "estado": eipd.estado}


@router.get("/impact-assessments/{assessment_id}/download")
def download_impact_assessment_report(
    assessment_id: int,
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    eipd = db.query(ImpactAssessment).filter(ImpactAssessment.id == assessment_id).first()
    if not eipd:
        raise HTTPException(status_code=404, detail="Evaluación EIPD no encontrada")

    area_nom = eipd.area.nombre if eipd.area else "División General"
    criterios_str = "\n".join([f"- [X] {c}" for c in eipd.criterios_alto_riesgo_json]) if eipd.criterios_alto_riesgo_json else "- Tratamiento intensivo de datos"

    doc = f"""# INFORME OFICIAL DE EVALUACIÓN DE IMPACTO EN PROTECCIÓN DE DATOS (EIPD / DPIA)
## CONFORME AL ARTÍCULO 25 DE LA LEY N° 21.719

**Código EIPD:** EIPD-{eipd.id:04d}  
**Título del Proyecto/Tratamiento:** {eipd.titulo}  
**Área / División Responsable:** {area_nom}  
**Base de Licitud Principal:** {eipd.base_licitud}  
**Fecha de Dictamen:** {eipd.fecha_evaluacion or datetime.now().strftime('%d/%m/%Y')}  
**Estado:** {eipd.estado}  
**Sello Criptográfico SHA-256:** `{eipd.hash_integridad}`  

---

### 1. DESCRIPCIÓN SISTEMÁTICA DEL TRATAMIENTO
{eipd.descripcion_tratamiento}

---

### 2. TEST DE ALTO RIESGO (CRITERIOS EUROPEOS & AGENCIA DE DATOS)
Se ha verificado la concurrencia de los siguientes factores de alto riesgo:
{criterios_str}

---

### 3. EVALUACIÓN DE NECESIDAD Y PROPORCIONALIDAD
**Análisis de Idoneidad y Necesidad:**  
{eipd.analisis_necesidad}

**Riesgos Identificados para los Derechos y Libertades de los Titulares:**  
{eipd.riesgos_derechos}

---

### 4. PLAN DE MITIGACIÓN Y SALVAGUARDAS TÉCNICO-ORGANIZATIVAS
{eipd.medidas_mitigacion}

- **Nivel de Riesgo Residual:** **{eipd.riesgo_residual}**

---

### 5. DICTAMEN VINCULANTE DEL ENCARGADO/A DE PROTECCIÓN DE DATOS (DPO)
{eipd.opinion_dpo}

**Veredicto:** APROBACIÓN CONDICIONADA AL CUMPLIMIENTO DE LAS SALVAGUARDAS.

____________________________________________
**Firma y Timbre del Delegado/a de Protección de Datos (DPO)**  
*Registro Oficial Ley N° 21.719*
"""

    headers = {"Content-Disposition": f"attachment; filename=EIPD_{eipd.id:04d}_Dictamen_Oficial.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


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

