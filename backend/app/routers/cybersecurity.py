import io
import json
import zipfile
from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import (
    Area,
    CyberAsset,
    CyberFase,
    CyberIncidentANCI,
    CyberMaturityAssessment,
    CyberPolicy,
    CyberProject,
    CyberTarea,
    User,
)
from app.schemas.domain import (
    CyberAssetCreate,
    CyberAssetRead,
    CyberIncidentANCICreate,
    CyberIncidentANCIRead,
    CyberIncidentANCIUpdate,
    CyberMaturityAssessmentCreate,
    CyberMaturityAssessmentRead,
    CyberPolicyCreate,
    CyberPolicyRead,
    CyberProjectRead,
    CyberTareaCreate,
    CyberTareaRead,
)

router = APIRouter(prefix="/cyber", tags=["Ciberseguridad (Ley 21.663 / ANCI)"])


@router.get("/dashboard")
def get_cyber_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    project = db.query(CyberProject).first()
    if not project:
        return {
            "metrics": [],
            "phases": [],
            "maturity": None,
            "active_incidents": [],
            "urgent_3h_count": 0,
            "assets_stats": {"total": 0, "criticos": 0, "conformes": 0}
        }

    fases = db.query(CyberFase).filter(CyberFase.proyecto_id == project.id).order_by(CyberFase.orden.asc()).all()
    
    global_progress = 0.0
    phases_progress = []
    active_weight_total = sum(f.ponderacion for f in fases if f.activo)
    
    for f in fases:
        tasks = f.tareas
        total_tasks = len(tasks)
        if not f.activo:
            f_progress = 100
        elif f.resuelto_externamente:
            f_progress = 100
        elif total_tasks > 0:
            completed_tasks = sum(1 for t in tasks if t.estado in ["Completada", "Resuelto Externamente"])
            f_progress = (completed_tasks / total_tasks) * 100.0
        else:
            f_progress = 0.0
            
        if f.activo and active_weight_total > 0:
            global_progress += (f_progress * (f.ponderacion / active_weight_total))

        phases_progress.append({
            "id": f.id,
            "nombre": f.nombre,
            "orden": f.orden,
            "descripcion": f.descripcion,
            "progreso": int(f_progress),
            "ponderacion": f.ponderacion,
            "activo": f.activo,
            "resuelto_externamente": f.resuelto_externamente,
            "nota_resolucion_externa": f.nota_resolucion_externa,
            "fecha_inicio": f.fecha_inicio_plan.isoformat(),
            "fecha_fin": f.fecha_fin_plan.isoformat(),
            "total_tareas": total_tasks,
            "tareas_completadas": sum(1 for t in tasks if t.estado in ["Completada", "Resuelto Externamente"])
        })
        
    project.progress = int(global_progress)
    db.commit()

    # Active ANCI incidents calculation
    now = datetime.now()
    incidents = db.query(CyberIncidentANCI).order_by(CyberIncidentANCI.fecha_deteccion.desc()).all()
    active_incidents = [inc for inc in incidents if inc.estado != "Mitigado y Notificado"]
    
    urgent_3h_count = 0
    for inc in active_incidents:
        if not inc.alerta_3h_enviada_anci and inc.fecha_limite_alerta_3h > now:
            urgent_3h_count += 1

    # Assets stats
    total_assets = db.query(CyberAsset).count()
    critical_assets = db.query(CyberAsset).filter(CyberAsset.criticidad.in_(["Crítico OIV", "Alto PSE"])).count()
    conforming_assets = db.query(CyberAsset).filter(CyberAsset.estado_cumplimiento == "Conforme").count()

    # Latest Maturity
    maturity = db.query(CyberMaturityAssessment).order_by(CyberMaturityAssessment.id.desc()).first()

    metrics = [
        {"label": "Madurez General Ciberseguridad", "value": f"{maturity.madurez_global if maturity else int(global_progress)}%", "trend": "Marco ANCI / NIST"},
        {"label": "Activos Críticos RSIC", "value": f"{total_assets} registrados", "trend": f"{critical_assets} esenciales OIV/PSE"},
        {"label": "Alertas Tempranas ANCI (3h)", "value": f"{len(active_incidents)} incidentes", "trend": f"{urgent_3h_count} urgentes <3h" if urgent_3h_count > 0 else "Al día"},
        {"label": "Controles Técnicos Mínimos", "value": f"{conforming_assets}/{total_assets}" if total_assets > 0 else "0", "trend": "Cifrado + MFA + Backup"},
    ]

    return {
        "user": current_user.full_name,
        "metrics": metrics,
        "phases": phases_progress,
        "maturity": CyberMaturityAssessmentRead.model_validate(maturity) if maturity else None,
        "active_incidents_count": len(active_incidents),
        "urgent_3h_count": urgent_3h_count,
        "assets_stats": {
            "total": total_assets,
            "criticos": critical_assets,
            "conformes": conforming_assets
        }
    }


@router.get("/project", response_model=list[CyberProjectRead])
def get_cyber_projects(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberProject).all()


@router.get("/fases")
def get_cyber_fases(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    project = db.query(CyberProject).first()
    if not project:
        return []
    fases = db.query(CyberFase).filter(CyberFase.proyecto_id == project.id).order_by(CyberFase.orden.asc()).all()
    res = []
    for f in fases:
        tareas_list = []
        for t in f.tareas:
            tareas_list.append({
                "id": t.id,
                "nombre": t.nombre,
                "descripcion": t.descripcion,
                "fase_id": t.fase_id,
                "area_responsable_id": t.area_responsable_id,
                "area_responsable": t.area_responsable.nombre if t.area_responsable else None,
                "usuario_asignado_id": t.usuario_asignado_id,
                "usuario_asignado": t.usuario_asignado.full_name if t.usuario_asignado else None,
                "fecha_inicio": t.fecha_inicio.isoformat(),
                "fecha_fin": t.fecha_fin.isoformat(),
                "estado": t.estado,
                "resuelto_externamente": t.resuelto_externamente,
                "estandar_asociado": t.estandar_asociado
            })
        res.append({
            "id": f.id,
            "nombre": f.nombre,
            "orden": f.orden,
            "descripcion": f.descripcion,
            "fecha_inicio_plan": f.fecha_inicio_plan.isoformat(),
            "fecha_fin_plan": f.fecha_fin_plan.isoformat(),
            "ponderacion": f.ponderacion,
            "activo": f.activo,
            "resuelto_externamente": f.resuelto_externamente,
            "nota_resolucion_externa": f.nota_resolucion_externa,
            "tareas": tareas_list
        })
    return res


@router.put("/fases/{fase_id}/toggle-modular")
def toggle_fase_modular(
    fase_id: int,
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    fase = db.query(CyberFase).filter(CyberFase.id == fase_id).first()
    if not fase:
        raise HTTPException(status_code=404, detail="Fase no encontrada")
        
    if "activo" in payload:
        fase.activo = bool(payload["activo"])
    if "resuelto_externamente" in payload:
        fase.resuelto_externamente = bool(payload["resuelto_externamente"])
    if "nota_resolucion_externa" in payload:
        fase.nota_resolucion_externa = str(payload["nota_resolucion_externa"])
        
    db.commit()
    db.refresh(fase)
    
    log_action(db, current_user.id, "Modificar Modularidad Fase Ciberseguridad", "CyberFase", {
        "fase_id": fase.id,
        "activo": fase.activo,
        "resuelto_externamente": fase.resuelto_externamente
    })
    return {"status": "ok", "fase_id": fase.id, "activo": fase.activo, "resuelto_externamente": fase.resuelto_externamente}


@router.put("/tareas/{tarea_id}", response_model=CyberTareaRead)
def update_cyber_tarea(
    tarea_id: int,
    payload: CyberTareaCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    tarea = db.query(CyberTarea).filter(CyberTarea.id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea de ciberseguridad no encontrada")
        
    for key, value in payload.model_dump().items():
        setattr(tarea, key, value)
        
    db.commit()
    db.refresh(tarea)
    log_action(db, current_user.id, "Actualizar Tarea Ciberseguridad", "CyberTarea", {"id": tarea.id, "nombre": tarea.nombre, "estado": tarea.estado})
    return tarea


# ==============================================================================
# ACTIVOS CRÍTICOS & SERVICIOS ESENCIALES (RSIC / OIV / PSE)
# ==============================================================================

@router.get("/assets", response_model=list[CyberAssetRead])
def get_cyber_assets(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberAsset).order_by(CyberAsset.id.asc()).all()


@router.post("/assets", response_model=CyberAssetRead, status_code=status.HTTP_201_CREATED)
def create_cyber_asset(
    payload: CyberAssetCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    count = db.query(CyberAsset).count() + 1
    codigo = payload.codigo_activo or f"RSIC-{str(count).zfill(4)}"
    
    asset = CyberAsset(
        codigo_activo=codigo,
        nombre=payload.nombre,
        tipo=payload.tipo,
        criticidad=payload.criticidad,
        servicio_esencial=payload.servicio_esencial,
        ubicacion_o_ip=payload.ubicacion_o_ip,
        area_responsable_id=payload.area_responsable_id,
        cifrado_activo=payload.cifrado_activo,
        mfa_activo=payload.mfa_activo,
        respaldo_inmutable=payload.respaldo_inmutable,
        estado_cumplimiento=payload.estado_cumplimiento
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    
    log_action(db, current_user.id, "Registrar Activo Crítico RSIC", "CyberAsset", {"codigo": asset.codigo_activo, "nombre": asset.nombre, "criticidad": asset.criticidad})
    return asset


@router.delete("/assets/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cyber_asset(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    asset = db.query(CyberAsset).filter(CyberAsset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")
    log_action(db, current_user.id, "Eliminar Activo RSIC", "CyberAsset", {"id": id, "codigo": asset.codigo_activo})
    db.delete(asset)
    db.commit()
    return None


# ==============================================================================
# INCIDENTES Y NOTIFICACIÓN ANCI (ALERTA 3H & INFORME 72H)
# ==============================================================================

@router.get("/incidents", response_model=list[CyberIncidentANCIRead])
def get_cyber_incidents(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberIncidentANCI).order_by(CyberIncidentANCI.fecha_deteccion.desc()).all()


@router.post("/incidents", response_model=CyberIncidentANCIRead, status_code=status.HTTP_201_CREATED)
def create_cyber_incident(
    payload: CyberIncidentANCICreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    now = datetime.now()
    deadline_3h = now + timedelta(hours=3)
    deadline_72h = now + timedelta(hours=72)
    
    count = db.query(CyberIncidentANCI).count() + 1
    codigo = f"INC-ANCI-{now.year}-{str(count).zfill(4)}"
    
    incident = CyberIncidentANCI(
        codigo_incidente=codigo,
        fecha_deteccion=now,
        fecha_limite_alerta_3h=deadline_3h,
        fecha_limite_informe_72h=deadline_72h,
        tipo_ataque=payload.tipo_ataque,
        severidad=payload.severidad,
        afecta_servicio_esencial=payload.afecta_servicio_esencial,
        descripcion=payload.descripcion,
        sistemas_comprometidos=payload.sistemas_comprometidos,
        medidas_contencion_aplicadas=payload.medidas_contencion_aplicadas,
        alerta_3h_enviada_anci=False,
        informe_72h_enviado_anci=False,
        estado="Alerta Inicial (3h)",
        reportado_por_id=current_user.id
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    log_action(db, current_user.id, "Reportar Ciberataque / Incidente ANCI", "CyberIncidentANCI", {
        "codigo": incident.codigo_incidente,
        "tipo": incident.tipo_ataque,
        "severidad": incident.severidad
    })
    return incident


@router.put("/incidents/{id}", response_model=CyberIncidentANCIRead)
def update_cyber_incident(
    id: int,
    payload: CyberIncidentANCIUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    inc = db.query(CyberIncidentANCI).filter(CyberIncidentANCI.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
        
    inc.estado = payload.estado
    if payload.medidas_contencion_aplicadas is not None:
        inc.medidas_contencion_aplicadas = payload.medidas_contencion_aplicadas
        
    if payload.alerta_3h_enviada_anci and not inc.alerta_3h_enviada_anci:
        inc.alerta_3h_enviada_anci = True
        inc.fecha_alerta_3h_anci = datetime.now()
        
    if payload.informe_72h_enviado_anci and not inc.informe_72h_enviado_anci:
        inc.informe_72h_enviado_anci = True
        inc.fecha_informe_72h_anci = datetime.now()
        
    db.commit()
    db.refresh(inc)
    
    log_action(db, current_user.id, "Actualizar Incidente ANCI", "CyberIncidentANCI", {
        "codigo": inc.codigo_incidente,
        "estado": inc.estado,
        "alerta_3h": inc.alerta_3h_enviada_anci
    })
    return inc


@router.get("/incidents/{id}/oficio-anci")
def download_oficio_anci(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    inc = db.query(CyberIncidentANCI).filter(CyberIncidentANCI.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
        
    report = "# FORMULARIO OFICIAL DE NOTIFICACIÓN DE INCIDENTE DE CIBERSEGURIDAD\n"
    report += "### A la Agencia Nacional de Ciberseguridad (ANCI) - Ley N° 21.663\n"
    report += f"**Código Único Institucional:** {inc.codigo_incidente}\n"
    report += f"**Fecha de Detección:** {inc.fecha_deteccion.strftime('%d/%m/%Y %H:%M:%S')}\n"
    report += f"**Plazo Límite Alerta Temprana (3 Horas):** {inc.fecha_limite_alerta_3h.strftime('%d/%m/%Y %H:%M:%S')}\n"
    report += f"**Plazo Límite Informe Técnico (72 Horas):** {inc.fecha_limite_informe_72h.strftime('%d/%m/%Y %H:%M:%S')}\n\n"
    report += "---\n\n"
    report += "### 1. Clasificación del Incidente y Organismo Responsable\n"
    report += f"- **Tipo de Ataque:** {inc.tipo_ataque}\n"
    report += f"- **Severidad Estimada:** {inc.severidad.upper()}\n"
    report += f"- **¿Afecta un Servicio Esencial u OIV?:** {'SÍ, ALERTA CRÍTICA' if inc.afecta_servicio_esencial else 'No'}\n\n"
    report += "### 2. Descripción de los Hechos e Indicadores de Compromiso (IoC)\n"
    report += f"> {inc.descripcion}\n\n"
    report += f"**Redes y Sistemas Afectados (RSIC):**\n{inc.sistemas_comprometidos}\n\n"
    report += "### 3. Medidas Inmediatas de Contención y Mitigación\n"
    report += f"{inc.medidas_contencion_aplicadas or 'Aislamiento de red, bloqueo perimetral en firewall y preservación de evidencia forense.'}\n\n"
    report += "### 4. Estado de Notificaciones a la ANCI\n"
    report += f"- **Alerta Temprana 3 Horas:** {'ENVIADA el ' + inc.fecha_alerta_3h_anci.strftime('%d/%m/%Y %H:%M') if inc.alerta_3h_enviada_anci else 'PENDIENTE DE ENVÍO'}\n"
    report += f"- **Informe Técnico 72 Horas:** {'ENVIADO el ' + inc.fecha_informe_72h_anci.strftime('%d/%m/%Y %H:%M') if inc.informe_72h_enviado_anci else 'En elaboración'}\n\n"
    report += "---\n*Emitido conforme a los Artículos 12 y 13 de la Ley N° 21.663 de Chile.*"

    headers = {"Content-Disposition": f"attachment; filename=Reporte_Oficial_ANCI_{inc.codigo_incidente}.md"}
    return StreamingResponse(io.BytesIO(report.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# EVALUACIÓN DE MADUREZ (NIST CSF / ANCI)
# ==============================================================================

@router.get("/maturity", response_model=list[CyberMaturityAssessmentRead])
def get_cyber_maturity(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberMaturityAssessment).order_by(CyberMaturityAssessment.id.desc()).all()


@router.post("/maturity", response_model=CyberMaturityAssessmentRead, status_code=status.HTTP_201_CREATED)
def create_cyber_maturity(
    payload: CyberMaturityAssessmentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    global_score = int((
        payload.porcentaje_identificar +
        payload.porcentaje_proteger +
        payload.porcentaje_detectar +
        payload.porcentaje_responder +
        payload.porcentaje_recuperar
    ) / 5.0)

    assessment = CyberMaturityAssessment(
        titulo=payload.titulo,
        fecha_evaluacion=date.today(),
        porcentaje_identificar=payload.porcentaje_identificar,
        porcentaje_proteger=payload.porcentaje_proteger,
        porcentaje_detectar=payload.porcentaje_detectar,
        porcentaje_responder=payload.porcentaje_responder,
        porcentaje_recuperar=payload.porcentaje_recuperar,
        madurez_global=global_score,
        conclusiones_ciso=payload.conclusiones_ciso,
        estado="Vigente"
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    log_action(db, current_user.id, "Registrar Evaluación de Madurez Ciberseguridad", "CyberMaturityAssessment", {"id": assessment.id, "score": global_score})
    return assessment


# ==============================================================================
# POLÍTICAS Y PLANES DE CIBERSEGURIDAD
# ==============================================================================

@router.get("/policies", response_model=list[CyberPolicyRead])
def get_cyber_policies(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberPolicy).order_by(CyberPolicy.id.asc()).all()


@router.get("/policies/{id}", response_model=CyberPolicyRead)
def get_cyber_policy(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    pol = db.query(CyberPolicy).filter(CyberPolicy.id == id).first()
    if not pol:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    return pol


@router.put("/policies/{id}", response_model=CyberPolicyRead)
def update_cyber_policy(
    id: int,
    payload: CyberPolicyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    pol = db.query(CyberPolicy).filter(CyberPolicy.id == id).first()
    if not pol:
        raise HTTPException(status_code=404, detail="Política no encontrada")
        
    pol.contenido = payload.contenido
    pol.version = payload.version
    pol.estado = payload.estado
    
    db.commit()
    db.refresh(pol)
    log_action(db, current_user.id, "Guardar Política de Ciberseguridad", "CyberPolicy", {"id": pol.id, "tipo": pol.tipo, "version": pol.version})
    return pol


# ==============================================================================
# EXPEDIENTE DE FISCALIZACIÓN ANCI (ZIP)
# ==============================================================================

@router.get("/evidence-zip")
def download_cyber_evidence_zip(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # 1. Gobernanza
        zip_file.writestr(
            "01_Gobernanza_ANCI/Acta_Designacion_CISO_Comite.txt",
            "Acta de designación formal del Responsable de Ciberseguridad / CISO ante la Agencia Nacional de Ciberseguridad (ANCI) - Ley 21.663."
        )
        
        # 2. Activos Críticos RSIC
        assets = db.query(CyberAsset).all()
        asset_lines = ["# INVENTARIO DE REDES Y SISTEMAS INFORMÁTICOS CRÍTICOS (RSIC)"]
        for a in assets:
            asset_lines.append(f"- [{a.codigo_activo}] {a.nombre} | Tipo: {a.tipo} | Criticidad: {a.criticidad} | MFA: {a.mfa_activo} | Cifrado: {a.cifrado_activo} | Estado: {a.estado_cumplimiento}")
        zip_file.writestr("02_Activos_Criticos_RSIC/Inventario_Activos.txt", "\n".join(asset_lines))
        
        # 3. Madurez NIST / ANCI
        maturity = db.query(CyberMaturityAssessment).order_by(CyberMaturityAssessment.id.desc()).first()
        if maturity:
            mat_text = f"# EVALUACIÓN DE MADUREZ NACIONAL DE CIBERSEGURIDAD\nMadurez Global: {maturity.madurez_global}%\n- Identificar: {maturity.porcentaje_identificar}%\n- Proteger: {maturity.porcentaje_proteger}%\n- Detectar: {maturity.porcentaje_detectar}%\n- Responder: {maturity.porcentaje_responder}%\n- Recuperar: {maturity.porcentaje_recuperar}%\nConclusiones:\n{maturity.conclusiones_ciso}"
            zip_file.writestr("03_Gestion_Riesgos_Madurez/Diagnostico_Madurez_NIST.txt", mat_text)
            
        # 4. Políticas
        policies = db.query(CyberPolicy).all()
        for p in policies:
            zip_file.writestr(f"04_Politicas_Continuidad/{p.tipo}_v{p.version}.txt", p.contenido)
            
        # 5. Incidentes ANCI
        incidents = db.query(CyberIncidentANCI).all()
        inc_lines = ["# REGISTRO DE INCIDENTES Y REPORTES ANCI (3h / 72h)"]
        for i in incidents:
            inc_lines.append(f"- {i.codigo_incidente} | Tipo: {i.tipo_ataque} | Severidad: {i.severidad} | Alerta 3h Enviada: {i.alerta_3h_enviada_anci} | Estado: {i.estado}")
        zip_file.writestr("05_Notificaciones_ANCI/Bitacora_Incidentes.txt", "\n".join(inc_lines))

    zip_buffer.seek(0)
    headers = {"Content-Disposition": "attachment; filename=Expediente_Ciberseguridad_Ley21663_ANCI.zip"}
    return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)
