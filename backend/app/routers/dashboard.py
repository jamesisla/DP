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
