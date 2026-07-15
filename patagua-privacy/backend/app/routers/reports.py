from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.modules import (
    ActionItem,
    Article14TerChecklistItem,
    DataMappingEntry,
    Finding,
    FindingsReport,
    ProcessingActivity,
    ReportSection,
    Risk,
)
from app.schemas.reports import (
    ChecklistItemCreate,
    ChecklistItemRead,
    ChecklistItemUpdate,
    ChecklistScore,
    ChecklistSeedResult,
    FindingsReportCreate,
    FindingsReportRead,
    FindingsReportUpdate,
    ReportGenerateResult,
)

router = APIRouter()
OrgQuery = Query(default=settings.default_organization_id, min_length=1)

DEFAULT_CHECKLIST_ITEMS = [
    ("14T-01", "Politica de tratamiento publicada"),
    ("14T-02", "Individualizacion del responsable"),
    ("14T-03", "Identificacion del DPO o encargado de prevencion si existe"),
    ("14T-04", "Canal de contacto para solicitudes de titulares"),
    ("14T-05", "Categorias de datos tratados"),
    ("14T-06", "Universo de titulares"),
    ("14T-07", "Destinatarios o cesionarios"),
    ("14T-08", "Finalidades de tratamiento"),
    ("14T-09", "Base de legitimidad"),
    ("14T-10", "Interes legitimo cuando corresponda"),
    ("14T-11", "Politica y medidas de seguridad"),
    ("14T-12", "Derechos de titulares"),
    ("14T-13", "Derecho a recurrir ante la Agencia"),
    ("14T-14", "Transferencias internacionales"),
    ("14T-15", "Periodo de conservacion"),
    ("14T-16", "Fuente de los datos"),
    ("14T-17", "Derecho a retirar consentimiento cuando corresponda"),
    ("14T-18", "Decisiones automatizadas y perfilamiento"),
]


def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")


def get_report(db: Session, report_id: int, organization_id: str) -> FindingsReport:
    report = db.query(FindingsReport).filter(FindingsReport.id == report_id, FindingsReport.organization_id == organization_id).first()
    if not report:
        raise not_found()
    return report


def report_to_read(db: Session, report: FindingsReport) -> dict:
    sections = db.query(ReportSection).filter(ReportSection.report_id == report.id).order_by(ReportSection.order_index.asc()).all()
    data = FindingsReportRead.model_validate(report).model_dump()
    data["sections"] = sections
    return data


def checklist_score(db: Session, organization_id: str) -> ChecklistScore:
    items = db.query(Article14TerChecklistItem).filter(Article14TerChecklistItem.organization_id == organization_id).all()
    counts = {status_name: len([item for item in items if item.status == status_name]) for status_name in ["cumple", "parcial", "no_cumple", "no_aplica"]}
    calculable = len(items) - counts["no_aplica"]
    points = counts["cumple"] * 100 + counts["parcial"] * 50
    score = round(points / calculable) if calculable else 0
    return ChecklistScore(total_items=len(items), score_porcentaje=score, **counts)


def risk_rank(level: str) -> int:
    normalized = level.lower()
    if normalized in {"critico", "critica"}:
        return 4
    if normalized in {"alto", "alta"}:
        return 3
    if normalized in {"medio", "media"}:
        return 2
    return 1


def global_risk_level(high_risks: int, high_gaps: int, sensitive: int, score: int) -> str:
    if high_risks + high_gaps >= 4 or score < 40:
        return "Critico"
    if high_risks + high_gaps >= 2 or sensitive >= 5 or score < 65:
        return "Alto"
    if high_risks + high_gaps >= 1 or score < 85:
        return "Medio"
    return "Bajo"


def build_report_sections(metrics: dict[str, int], risks: list[Risk], gaps: list[Finding], actions: list[ActionItem]) -> list[dict]:
    top_risks = sorted(risks, key=lambda item: risk_rank(item.priority), reverse=True)[:5]
    top_gaps = sorted(gaps, key=lambda item: risk_rank(item.risk_level), reverse=True)[:5]
    recommended_actions = actions[:6]
    return [
        {
            "section_type": "resumen_ejecutivo",
            "title": "Resumen ejecutivo",
            "content": (
                f"Se analizaron {metrics['total_registros_matriz']} registros de matriz y "
                f"{metrics['total_actividades_tratamiento']} actividades de tratamiento. "
                f"El score Articulo 14 ter es {metrics['score_articulo_14ter']}% y el nivel global de riesgo es {metrics['global_risk_level']}."
            ),
            "order_index": 1,
        },
        {
            "section_type": "conclusiones",
            "title": "Conclusiones principales",
            "content": "La organizacion cuenta con insumos base para consolidar transparencia, riesgos y acciones. Las prioridades deben enfocarse en brechas de alto riesgo, evidencias del checklist y formalizacion de controles.",
            "order_index": 2,
        },
        {
            "section_type": "inventario_tratamientos",
            "title": "Inventario de tratamientos",
            "content": f"El catalogo contiene {metrics['total_actividades_tratamiento']} actividades. Existen {metrics['total_transferencias_internacionales']} tratamientos o datos con transferencia internacional y {metrics['total_perfilamiento']} registros con perfilamiento.",
            "order_index": 3,
        },
        {
            "section_type": "riesgos",
            "title": "Riesgos principales",
            "content": "\n".join([f"- {risk.title}: {risk.priority} ({risk.status})" for risk in top_risks]) or "No existen riesgos registrados.",
            "order_index": 4,
        },
        {
            "section_type": "brechas",
            "title": "Brechas de cumplimiento",
            "content": "\n".join([f"- {gap.title}: {gap.risk_level}. Recomendacion: {gap.recommendation}" for gap in top_gaps]) or "No existen brechas registradas.",
            "order_index": 5,
        },
        {
            "section_type": "checklist_14ter",
            "title": "Checklist Articulo 14 ter",
            "content": f"Resultado del checklist: {metrics['score_articulo_14ter']}%. Items cumplidos: {metrics['checklist_cumple']}; parciales: {metrics['checklist_parcial']}; no cumple: {metrics['checklist_no_cumple']}.",
            "order_index": 6,
        },
        {
            "section_type": "plan_accion",
            "title": "Plan de accion recomendado",
            "content": "\n".join([f"- {action.title} / Responsable: {action.owner} / Estado: {action.status}" for action in recommended_actions]) or "Crear acciones asociadas a brechas y riesgos prioritarios.",
            "order_index": 7,
        },
        {
            "section_type": "roadmap",
            "title": "Roadmap 30/60/90 dias",
            "content": "30 dias: cerrar evidencias criticas y aprobar responsables. 60 dias: ejecutar controles de alto riesgo y actualizar politicas. 90 dias: validar catalogo publicado, revisar metricas y presentar avance al Comite Ejecutivo.",
            "order_index": 8,
        },
    ]


@router.get("/article-14ter-checklist/score", response_model=ChecklistScore, tags=["Checklist Articulo 14 ter"])
def get_article_14ter_score(organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> ChecklistScore:
    return checklist_score(db, organization_id)


@router.post("/article-14ter-checklist/seed-defaults", response_model=ChecklistSeedResult, tags=["Checklist Articulo 14 ter"])
def seed_article_14ter_defaults(organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> ChecklistSeedResult:
    existing_codes = {
        item.code
        for item in db.query(Article14TerChecklistItem).filter(Article14TerChecklistItem.organization_id == organization_id).all()
    }
    created = 0
    for code, requirement in DEFAULT_CHECKLIST_ITEMS:
        if code in existing_codes:
            continue
        db.add(
            Article14TerChecklistItem(
                organization_id=organization_id,
                code=code,
                requirement=requirement,
                recommendation="Levantar evidencia, responsable y decision de cumplimiento.",
                priority="Alta" if code in {"14T-01", "14T-04", "14T-09", "14T-11"} else "Media",
            )
        )
        created += 1
    db.commit()
    return ChecklistSeedResult(created=created, existing=len(existing_codes))


@router.get("/article-14ter-checklist", response_model=list[ChecklistItemRead], tags=["Checklist Articulo 14 ter"])
def list_checklist_items(organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    return db.query(Article14TerChecklistItem).filter(Article14TerChecklistItem.organization_id == organization_id).order_by(Article14TerChecklistItem.code.asc()).all()


@router.get("/article-14ter-checklist/{record_id}", response_model=ChecklistItemRead, tags=["Checklist Articulo 14 ter"])
def get_checklist_item(record_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    item = db.query(Article14TerChecklistItem).filter(Article14TerChecklistItem.id == record_id, Article14TerChecklistItem.organization_id == organization_id).first()
    if not item:
        raise not_found()
    return item


@router.post("/article-14ter-checklist", response_model=ChecklistItemRead, status_code=status.HTTP_201_CREATED, tags=["Checklist Articulo 14 ter"])
def create_checklist_item(payload: ChecklistItemCreate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    item = Article14TerChecklistItem(**payload.model_dump(), organization_id=organization_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/article-14ter-checklist/{record_id}", response_model=ChecklistItemRead, tags=["Checklist Articulo 14 ter"])
def update_checklist_item(record_id: int, payload: ChecklistItemUpdate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    item = db.query(Article14TerChecklistItem).filter(Article14TerChecklistItem.id == record_id, Article14TerChecklistItem.organization_id == organization_id).first()
    if not item:
        raise not_found()
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/article-14ter-checklist/{record_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Checklist Articulo 14 ter"])
def delete_checklist_item(record_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> None:
    item = db.query(Article14TerChecklistItem).filter(Article14TerChecklistItem.id == record_id, Article14TerChecklistItem.organization_id == organization_id).first()
    if not item:
        raise not_found()
    db.delete(item)
    db.commit()


@router.post("/findings-reports/generate", response_model=ReportGenerateResult, tags=["Informe de Hallazgos"])
def generate_findings_report(organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> dict:
    score = checklist_score(db, organization_id)
    risks = db.query(Risk).filter(Risk.organization_id == organization_id).all()
    gaps = db.query(Finding).filter(Finding.organization_id == organization_id).all()
    actions = db.query(ActionItem).filter(ActionItem.organization_id == organization_id).order_by(ActionItem.due_date.asc().nullslast()).all()

    total_riesgos_altos = len([risk for risk in risks if risk_rank(risk.priority) >= 3])
    total_brechas_altas = len([gap for gap in gaps if risk_rank(gap.risk_level) >= 3])
    global_level = global_risk_level(total_riesgos_altos, total_brechas_altas, db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id, DataMappingEntry.is_sensitive.is_(True)).count(), score.score_porcentaje)
    metrics = {
        "total_actividades_tratamiento": db.query(ProcessingActivity).filter(ProcessingActivity.organization_id == organization_id).count(),
        "total_registros_matriz": db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id).count(),
        "total_datos_sensibles": db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id, DataMappingEntry.is_sensitive.is_(True)).count(),
        "total_transferencias_internacionales": db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id, DataMappingEntry.international_transfer.is_(True)).count(),
        "total_perfilamiento": db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id, DataMappingEntry.profiling.is_(True)).count(),
        "total_riesgos_altos": total_riesgos_altos,
        "total_brechas_altas": total_brechas_altas,
        "score_articulo_14ter": score.score_porcentaje,
        "checklist_cumple": score.cumple,
        "checklist_parcial": score.parcial,
        "checklist_no_cumple": score.no_cumple,
        "global_risk_level": global_level,
    }
    now = datetime.now(timezone.utc)
    report = FindingsReport(
        organization_id=organization_id,
        title=f"Informe de Hallazgos de Privacidad - {now.strftime('%Y-%m-%d')}",
        version="1.0",
        status="borrador",
        executive_summary=build_report_sections(metrics, risks, gaps, actions)[0]["content"],
        main_conclusions="Priorizar brechas de alto riesgo, completar evidencias Articulo 14 ter y mantener el catalogo actualizado.",
        main_risks_summary=f"Riesgos altos o criticos identificados: {total_riesgos_altos}.",
        compliance_gaps_summary=f"Brechas altas o criticas identificadas: {total_brechas_altas}.",
        article_14ter_score=score.score_porcentaje,
        global_risk_level=global_level,
        generated_at=now,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    for section in build_report_sections(metrics, risks, gaps, actions):
        db.add(ReportSection(report_id=report.id, **section))
    db.commit()
    return {"report": report_to_read(db, report), "metrics": metrics}


@router.get("/findings-reports", response_model=list[FindingsReportRead], tags=["Informe de Hallazgos"])
def list_findings_reports(organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> list[dict]:
    reports = db.query(FindingsReport).filter(FindingsReport.organization_id == organization_id).order_by(FindingsReport.id.desc()).all()
    return [report_to_read(db, report) for report in reports]


@router.get("/findings-reports/{report_id}", response_model=FindingsReportRead, tags=["Informe de Hallazgos"])
def get_findings_report(report_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    return report_to_read(db, get_report(db, report_id, organization_id))


@router.post("/findings-reports", response_model=FindingsReportRead, status_code=status.HTTP_201_CREATED, tags=["Informe de Hallazgos"])
def create_findings_report(payload: FindingsReportCreate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"sections"})
    report = FindingsReport(**data, organization_id=organization_id)
    db.add(report)
    db.commit()
    db.refresh(report)
    for section in payload.sections:
        db.add(ReportSection(report_id=report.id, **section.model_dump()))
    db.commit()
    return report_to_read(db, report)


@router.put("/findings-reports/{report_id}", response_model=FindingsReportRead, tags=["Informe de Hallazgos"])
def update_findings_report(report_id: int, payload: FindingsReportUpdate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    report = get_report(db, report_id, organization_id)
    data = payload.model_dump(exclude_unset=True, exclude={"sections"})
    if data.get("status") in {"aprobado", "emitido"} and not data.get("approved_at") and not report.approved_at:
        data["approved_at"] = datetime.now(timezone.utc)
    for field, value in data.items():
        setattr(report, field, value)
    if payload.sections is not None:
        db.query(ReportSection).filter(ReportSection.report_id == report.id).delete()
        for section in payload.sections:
            db.add(ReportSection(report_id=report.id, **section.model_dump()))
    db.commit()
    db.refresh(report)
    return report_to_read(db, report)


@router.delete("/findings-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Informe de Hallazgos"])
def delete_findings_report(report_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> None:
    report = get_report(db, report_id, organization_id)
    db.query(ReportSection).filter(ReportSection.report_id == report.id).delete()
    db.delete(report)
    db.commit()
