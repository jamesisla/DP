from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import calculate_business_days_remaining, get_current_user
from app.models.domain import (
    ArcoRequest,
    Fase,
    ImplementationProject,
    LogAuditoria,
    Proveedor,
    SecurityBreach,
    Tarea,
    User,
)

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
def get_dashboard_data(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    project = db.query(ImplementationProject).first()
    if not project:
        return {"metrics": [], "phases": [], "focus": [], "critical_path_alert": None, "recent_activity": []}

    fases = db.query(Fase).filter(Fase.proyecto_id == project.id).order_by(Fase.orden.asc()).all()
    
    global_progress = 0.0
    phases_progress = []
    
    for f in fases:
        tasks = f.tareas
        total_tasks = len(tasks)
        if total_tasks > 0:
            completed_tasks = sum(1 for t in tasks if t.estado == "Completada")
            f_progress = (completed_tasks / total_tasks) * 100.0
        else:
            f_progress = 0.0
            
        global_progress += (f_progress * (f.ponderacion / 100.0))
        phases_progress.append({
            "id": f.id,
            "nombre": f.nombre,
            "orden": f.orden,
            "progreso": int(f_progress),
            "ponderacion": f.ponderacion,
            "fecha_inicio": f.fecha_inicio_plan.isoformat(),
            "fecha_fin": f.fecha_fin_plan.isoformat()
        })
        
    project.progress = int(global_progress)
    db.commit()

    # Countdown to Dec 1, 2026
    legal_deadline = datetime(2026, 12, 1)
    time_left = legal_deadline - datetime.now()
    days_left = max(0, time_left.days)

    # Critical path check
    critical_path_alert = None
    today = date.today()
    delayed_critical_tasks = db.query(Tarea).join(Fase).filter(
        Tarea.estado != "Completada",
        Tarea.fecha_fin < today
    ).all()
    
    if delayed_critical_tasks:
        critical_task = delayed_critical_tasks[0]
        area_nombre = critical_task.area_responsable.nombre if critical_task.area_responsable else "Legal"
        critical_path_alert = f"Advertencia: Para cumplir con la fecha legal, debes finalizar la tarea crítica '{critical_task.nombre}' del área {area_nombre} (vencía el {critical_task.fecha_fin.strftime('%d/%m/%Y')})."

    # ARCO+ stats
    total_arco = db.query(ArcoRequest).count()
    pending_arco = db.query(ArcoRequest).filter(ArcoRequest.estado.in_(["Ingresada", "En análisis"])).count()
    urgent_arco = 0
    for req in db.query(ArcoRequest).filter(ArcoRequest.estado.in_(["Ingresada", "En análisis"])).all():
        if calculate_business_days_remaining(req.fecha_limite_legal) <= 5:
            urgent_arco += 1

    # Security breaches stats
    total_breaches = db.query(SecurityBreach).count()
    active_breaches = db.query(SecurityBreach).filter(SecurityBreach.estado.in_(["En contención", "En investigación"])).count()
    unnotified_breaches = db.query(SecurityBreach).filter(SecurityBreach.notificado_agencia.is_(False), SecurityBreach.estado != "Mitigado y Cerrado").count()

    # Recent audit feed
    logs = db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.desc()).limit(10).all()
    recent_activity = [
        {
            "id": log.id,
            "usuario": log.usuario.full_name if log.usuario else "Sistema",
            "accion": log.accion,
            "fecha_hora": log.fecha_hora.strftime("%Y-%m-%d %H:%M:%S"),
            "detalle": log.detalle_json
        } for log in logs
    ]

    metrics = [
        {"label": "Avance General Ley 21.719", "value": f"{int(global_progress)}%", "trend": "ponderado"},
        {"label": "Días Restantes Entrada Vigencia", "value": str(days_left), "trend": "01 Dic 2026"},
        {"label": "Solicitudes ARCO+ (15d)", "value": f"{pending_arco} activas", "trend": f"{urgent_arco} urgentes" if urgent_arco > 0 else "Al día"},
        {"label": "Brechas de Seguridad (72h)", "value": f"{active_breaches} incidentes", "trend": f"{unnotified_breaches} por notificar" if unnotified_breaches > 0 else "Bajo control"},
    ]

    focus = [
        "Completar Wizard de Levantamiento de Información en todas las divisiones.",
        "Monitorear las solicitudes de Derechos ARCO+ en curso antes del vencimiento de 15 días hábiles.",
        "Verificar que los contratos de proveedores con vigencia menor a 6 meses cuenten con el Anexo Ley 21.719.",
    ]

    return {
        "user": current_user.full_name,
        "metrics": metrics,
        "phases": phases_progress,
        "focus": focus,
        "critical_path_alert": critical_path_alert,
        "recent_activity": recent_activity,
        "stats": {
            "total_tasks": db.query(Tarea).count(),
            "completed_tasks": db.query(Tarea).filter(Tarea.estado == "Completada").count(),
            "total_providers": db.query(Proveedor).count(),
            "total_arco": total_arco,
            "pending_arco": pending_arco,
            "urgent_arco": urgent_arco,
            "total_breaches": total_breaches,
            "active_breaches": active_breaches,
            "unnotified_breaches": unnotified_breaches
        }
    }


# ==============================================================================
# CRONOGRAMA Y CALENDARIO REGULATORIO GRC UNIFICADO (2026 - 2027)
# ==============================================================================

@router.get("/compliance-timeline")
def get_compliance_timeline(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Cronograma integrado de vencimientos legales, plazos operativos e hitos regulatorios."""
    today = date.today()
    now = datetime.now()

    # 1. Hitos Legales Estatutarios
    milestones = [
        {
            "id": "l21719_enactment",
            "ley": "Ley 21.719",
            "titulo": "Entrada en Vigor Plena Ley N° 21.719",
            "descripcion": "Exigibilidad total de la Agencia de Protección de Datos Personales, sanciones (hasta 20.000 UTM) y derechos ARCO+.",
            "fecha": "2026-12-01",
            "tipo": "Hito Legal Mandatorio",
            "urgencia": "Alta",
            "estado": "En Cuenta Regresiva",
            "dias_restantes": max(0, (date(2026, 12, 1) - today).days)
        },
        {
            "id": "l21663_anci_enforcement",
            "ley": "Ley 21.663",
            "titulo": "Exigibilidad Plena Régimen Sancionatorio ANCI",
            "descripcion": "Fiscalización de operadores RSIC/OIV y aplicación de multas de hasta 40.000 UTM por incumplimiento de notificación en 3h.",
            "fecha": "2026-09-01",
            "tipo": "Hito Legal Mandatorio",
            "urgencia": "Alta",
            "estado": "En Cuenta Regresiva",
            "dias_restantes": max(0, (date(2026, 9, 1) - today).days)
        },
        {
            "id": "wargame_annual",
            "ley": "Ley 21.663",
            "titulo": "Simulacro Anual Obligatorio de Crisis ANCI (War Game)",
            "descripcion": "Ejercitación de mesa (Tabletop) de respuesta a Ransomware con acta suscrita por el Comité de Crisis.",
            "fecha": "2026-08-25",
            "tipo": "Simulacro & Resiliencia",
            "urgencia": "Media",
            "estado": "Programado",
            "dias_restantes": max(0, (date(2026, 8, 25) - today).days)
        },
        {
            "id": "pgsi_review",
            "ley": "Ley 21.663",
            "titulo": "Revisión Semestral de la Política PGSI y Planes BCP/PRI",
            "descripcion": "Auditoría de políticas de seguridad de la información y planes de continuidad operacional.",
            "fecha": "2026-10-15",
            "tipo": "Gobernanza & Auditoría",
            "urgencia": "Media",
            "estado": "Programado",
            "dias_restantes": max(0, (date(2026, 10, 15) - today).days)
        },
        {
            "id": "training_annual",
            "ley": "Ley 21.719",
            "titulo": "Cierre Campaña Anual de Concientización & Phishing",
            "descripcion": "Emisión de certificados y acreditación de cobertura del personal ante la Contraloría y la ANCI.",
            "fecha": "2026-11-15",
            "tipo": "Capacitación & Cultura",
            "urgencia": "Media",
            "estado": "En Ejecución",
            "dias_restantes": max(0, (date(2026, 11, 15) - today).days)
        }
    ]

    # 2. Vencimientos Operacionales ARCO+
    arcos = db.query(ArcoRequest).filter(ArcoRequest.estado.in_(["Ingresada", "En análisis"])).all()
    for a in arcos:
        rem_days = calculate_business_days_remaining(a.fecha_limite_legal)
        milestones.append({
            "id": f"arco_{a.id}",
            "ley": "Ley 21.719",
            "titulo": f"Solicitud ARCO+ Folio {a.folio} ({a.tipo_derecho})",
            "descripcion": f"Titular: {a.titular_nombre}. Plazo legal de respuesta: 15 días hábiles administrativos.",
            "fecha": a.fecha_limite_legal.isoformat(),
            "tipo": "Plazo Operacional ARCO+",
            "urgencia": "Crítica" if rem_days <= 5 else "Alta" if rem_days <= 10 else "Media",
            "estado": f"{rem_days} días hábiles restantes",
            "dias_restantes": rem_days
        })

    # 3. Brechas de Seguridad (72h)
    breaches = db.query(SecurityBreach).filter(SecurityBreach.estado.in_(["En contención", "En investigación"])).all()
    for b in breaches:
        milestones.append({
            "id": f"breach_{b.id}",
            "ley": "Ley 21.719",
            "titulo": f"Brecha de Seguridad [{b.codigo_incidente}]",
            "descripcion": f"Notificación perentoria en 72h. Titulares afectados: {b.titulares_afectados_aprox}.",
            "fecha": b.fecha_deteccion.strftime("%Y-%m-%d"),
            "tipo": "Plazo Brecha 72h",
            "urgencia": "Crítica",
            "estado": "En Investigación",
            "dias_restantes": 3
        })

    # Sort by dias_restantes ascending
    milestones.sort(key=lambda x: x["dias_restantes"])

    return milestones

