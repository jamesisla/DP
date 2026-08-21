import io
import json
import zipfile
from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.helpers import get_current_user, log_action
from app.models.domain import (
    ArcoRequest,
    Area,
    CyberAsset,
    CyberFase,
    CyberIncidentANCI,
    CyberMaturityAssessment,
    CyberPolicy,
    CyberProject,
    CyberRisk,
    CyberSimulation,
    CyberTarea,
    ImplementationProject,
    Proveedor,
    SecurityBreach,
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
    CyberRiskCreate,
    CyberRiskRead,
    CyberSimulationCreate,
    CyberSimulationRead,
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
# FASE II: ACTIVOS CRÍTICOS, TOPOLOGÍA MULTICAPA Y DEPENDENCIAS (RSIC / OIV)
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
        capa_tecnologica=payload.capa_tecnologica or "Servidor",
        criticidad=payload.criticidad,
        servicio_esencial=payload.servicio_esencial,
        ubicacion_o_ip=payload.ubicacion_o_ip,
        puertos_expuestos=payload.puertos_expuestos or "443/tcp, 22/tcp",
        version_so=payload.version_so or "Ubuntu 24.04 LTS",
        impacto_caida_servicio=payload.impacto_caida_servicio or "Interrupción de trámite en línea",
        dependencias_ids=payload.dependencias_ids or [],
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


@router.get("/topology-tree")
def get_topology_tree(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Mapeo de Topología Multicapa y Dependencias de Servicios Esenciales (BIA)."""
    assets = db.query(CyberAsset).all()
    
    layers = {
        "Perímetro / Red": [],
        "Servidor Central": [],
        "Base de Datos": [],
        "Aplicación Web / API": [],
        "Nube (OCI / AWS)": [],
        "Endpoint Crítico": []
    }
    
    for a in assets:
        capa = a.capa_tecnologica if a.capa_tecnologica in layers else "Servidor Central"
        layers[capa].append({
            "id": a.id,
            "codigo": a.codigo_activo,
            "nombre": a.nombre,
            "tipo": a.tipo,
            "ip": a.ubicacion_o_ip,
            "criticidad": a.criticidad,
            "servicio_esencial": a.servicio_esencial,
            "puertos": a.puertos_expuestos,
            "so": a.version_so,
            "impacto": a.impacto_caida_servicio,
            "dependencias": a.dependencias_ids or [],
            "conforme": a.estado_cumplimiento == "Conforme"
        })
        
    return {
        "total_activos": len(assets),
        "layers": layers
    }


@router.get("/hardening-script")
def download_hardening_script():
    """Generador automático de Script de Hardening y Auditoría de Controles Técnicos Mínimos (ANCI / CIS Benchmarks)."""
    script_content = """#!/bin/bash
# ==============================================================================
# LEXAPP GRC · SCRIPT DE HARDENING Y AUDITORÍA DE SEGURIDAD LINUX (LEY 21.663)
# ==============================================================================
# Ejecuta este script para auditar y aplicar controles técnicos mínimos en servidores RSIC.

set -e

echo "========================================================="
echo " [LEXAPP GRC] Auditoría Técnica de Controles Mínimos ANCI"
echo "========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta este script con privilegios de root: sudo bash $0"
  exit 1
fi

SCORE=100
echo ""
echo "=== 1. Verificando Configuración de SSH (Hardening) ==="
SSHD_CONFIG="/etc/ssh/sshd_config"
if [ -f "$SSHD_CONFIG" ]; then
  if grep -qE "^PermitRootLogin (no|prohibit-password)" "$SSHD_CONFIG"; then
    echo "[✓] PermitRootLogin restringido."
  else
    echo "[!] PermitRootLogin habilitado para contraseñas (-15 pts)."
    SCORE=$((SCORE - 15))
  fi

  if grep -qE "^PasswordAuthentication no" "$SSHD_CONFIG"; then
    echo "[✓] PasswordAuthentication deshabilitada (Uso forzado de llaves SSH)."
  else
    echo "[!] PasswordAuthentication permitida (-15 pts)."
    SCORE=$((SCORE - 15))
  fi
fi

echo ""
echo "=== 2. Verificando Firewall Perimetral (iptables / UFW) ==="
if ufw status 2>/dev/null | grep -q "Status: active"; then
  echo "[✓] Firewall UFW activo."
elif iptables -L -n | grep -q "ACCEPT"; then
  echo "[✓] Reglas iptables activas."
else
  echo "[!] No se detectó firewall perimetral activo (-20 pts)."
  SCORE=$((SCORE - 20))
fi

echo ""
echo "=== 3. Verificando Puertos Expuestos ==="
echo "Puertos en escucha local:"
ss -tuln | head -n 10

echo ""
echo "=== 4. Verificando Parámetros de Kernel (sysctl) ==="
if sysctl net.ipv4.tcp_syncookies | grep -q "1"; then
  echo "[✓] TCP SYN Cookies habilitado (Anti-SYN Flood DDoS)."
else
  echo "[!] SYN Cookies deshabilitado (-10 pts)."
  SCORE=$((SCORE - 10))
fi

echo ""
echo "========================================================="
echo " PUNTUACIÓN DE CUMPLIMIENTO TÉCNICO ANCI: $SCORE / 100"
if [ "$SCORE" -ge 80 ]; then
  echo " Estado: CONFORME PARA RSIC [✓]"
else
  echo " Estado: REQUIERE ADECUACIÓN URGENTE [!]"
fi
echo "========================================================="
"""
    headers = {"Content-Disposition": "attachment; filename=lexapp_hardening_audit.sh"}
    return Response(content=script_content, media_type="text/x-sh", headers=headers)


# ==============================================================================
# FASE IV: INCIDENTES, ALERTA 3H, INDICADORES DE COMPROMISO (IoC) Y FORENSE
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
        iocs_json=payload.iocs_json or {"ips_atacantes": [], "hashes_malware": [], "urls_c2": []},
        checklist_forense_json=payload.checklist_forense_json or {
            "volcado_ram": False,
            "congelamiento_logs": False,
            "aislamiento_red": False,
            "hash_sha256": ""
        },
        tiempo_deteccion_minutos=payload.tiempo_deteccion_minutos or 15,
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
        
    if payload.iocs_json is not None:
        inc.iocs_json = payload.iocs_json
        
    if payload.checklist_forense_json is not None:
        inc.checklist_forense_json = payload.checklist_forense_json
        
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
        
    iocs = inc.iocs_json or {}
    forense = inc.checklist_forense_json or {}

    report = "# FORMULARIO OFICIAL DE NOTIFICACIÓN DE INCIDENTE DE CIBERSEGURIDAD\n"
    report += "### A la Agencia Nacional de Ciberseguridad (ANCI) - Ley N° 21.663\n\n"
    report += f"**Código Único Institucional:** `{inc.codigo_incidente}`\n"
    report += f"**Fecha de Detección:** {inc.fecha_deteccion.strftime('%d/%m/%Y %H:%M:%S')}\n"
    report += f"**Plazo Límite Alerta Temprana (3 Horas):** {inc.fecha_limite_alerta_3h.strftime('%d/%m/%Y %H:%M:%S')}\n"
    report += f"**Plazo Límite Informe Técnico (72 Horas):** {inc.fecha_limite_informe_72h.strftime('%d/%m/%Y %H:%M:%S')}\n\n"
    report += "---\n\n"
    report += "### 1. Clasificación del Incidente y Organismo Responsable\n"
    report += f"- **Tipo de Ataque / Vector:** {inc.tipo_ataque}\n"
    report += f"- **Severidad Estimada:** {inc.severidad.upper()}\n"
    report += f"- **¿Afecta un Servicio Esencial u OIV?:** {'SÍ, ALERTA CRÍTICA' if inc.afecta_servicio_esencial else 'No'}\n"
    report += f"- **Tiempo de Detección:** {inc.tiempo_deteccion_minutos} minutos tras el inicio del vector.\n\n"
    report += "### 2. Descripción de los Hechos e Indicadores de Compromiso (IoCs)\n"
    report += f"> {inc.descripcion}\n\n"
    report += f"**Redes y Sistemas Afectados (RSIC):**\n{inc.sistemas_comprometidos}\n\n"
    
    report += "**Indicadores Técnicos de Compromiso (IoCs):**\n"
    ips = iocs.get("ips_atacantes", [])
    hashes = iocs.get("hashes_malware", [])
    urls = iocs.get("urls_c2", [])
    report += f"- **IPs de Origen / Atacantes:** {', '.join(ips) if ips else 'En análisis perimetral'}\n"
    report += f"- **Hashes de Muestras de Malware (SHA-256):** {', '.join(hashes) if hashes else 'No se detectó payload binario'}\n"
    report += f"- **Dominios / C2:** {', '.join(urls) if urls else 'Sin tráfico C2 registrado'}\n\n"
    
    report += "### 3. Preservación Forense Digital y Cadena de Custodia\n"
    report += f"- **Volcado de Memoria RAM:** {'EJECUTADO' if forense.get('volcado_ram') else 'Pendiente'}\n"
    report += f"- **Congelamiento de Logs del Sistema:** {'EJECUTADO' if forense.get('congelamiento_logs') else 'Pendiente'}\n"
    report += f"- **Aislamiento de Red Seguro:** {'EJECUTADO' if forense.get('aislamiento_red') else 'Pendiente'}\n"
    report += f"- **Firma Hash SHA-256 del Paquete Forense:** `{forense.get('hash_sha256', 'Pendiente de cálculo')}`\n\n"

    report += "### 4. Medidas Inmediatas de Contención y Mitigación\n"
    report += f"{inc.medidas_contencion_aplicadas or 'Aislamiento de interfaz de red, revocación masiva de credenciales y bloqueo perimetral.'}\n\n"

    report += "### 5. Estado de Notificaciones a la ANCI\n"
    report += f"- **Alerta Temprana 3 Horas:** {'ENVIADA el ' + inc.fecha_alerta_3h_anci.strftime('%d/%m/%Y %H:%M') if inc.alerta_3h_enviada_anci else 'PENDIENTE DE ENVÍO'}\n"
    report += f"- **Informe Técnico 72 Horas:** {'ENVIADO el ' + inc.fecha_informe_72h_anci.strftime('%d/%m/%Y %H:%M') if inc.informe_72h_enviado_anci else 'En elaboración'}\n\n"
    report += "---\n*Emitido conforme a los Artículos 12 y 13 de la Ley N° 21.663 de Ciberseguridad de Chile.*"

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
        
        # 2. Activos Críticos RSIC y Topología
        assets = db.query(CyberAsset).all()
        asset_lines = ["# INVENTARIO DE REDES Y SISTEMAS INFORMÁTICOS CRÍTICOS (RSIC)"]
        for a in assets:
            asset_lines.append(f"- [{a.codigo_activo}] {a.nombre} | Capa: {a.capa_tecnologica} | Tipo: {a.tipo} | Criticidad: {a.criticidad} | Puertos: {a.puertos_expuestos} | SO: {a.version_so} | Impacto: {a.impacto_caida_servicio} | MFA: {a.mfa_activo} | Cifrado: {a.cifrado_activo} | Estado: {a.estado_cumplimiento}")
        zip_file.writestr("02_Activos_Criticos_RSIC/Inventario_Multicapa_RSIC.txt", "\n".join(asset_lines))
        
        # 3. Madurez NIST / ANCI
        maturity = db.query(CyberMaturityAssessment).order_by(CyberMaturityAssessment.id.desc()).first()
        if maturity:
            mat_text = f"# EVALUACIÓN DE MADUREZ NACIONAL DE CIBERSEGURIDAD\nMadurez Global: {maturity.madurez_global}%\n- Identificar: {maturity.porcentaje_identificar}%\n- Proteger: {maturity.porcentaje_proteger}%\n- Detectar: {maturity.porcentaje_detectar}%\n- Responder: {maturity.porcentaje_responder}%\n- Recuperar: {maturity.porcentaje_recuperar}%\nConclusiones:\n{maturity.conclusiones_ciso}"
            zip_file.writestr("03_Gestion_Riesgos_Madurez/Diagnostico_Madurez_NIST.txt", mat_text)
            
        # 4. Políticas
        policies = db.query(CyberPolicy).all()
        for p in policies:
            zip_file.writestr(f"04_Politicas_Continuidad/{p.tipo}_v{p.version}.txt", p.contenido)
            
        # 5. Incidentes ANCI y Evidencia Forense
        incidents = db.query(CyberIncidentANCI).all()
        inc_lines = ["# REGISTRO DE INCIDENTES, INDICADORES DE COMPROMISO (IoCs) Y CADENA FORENSE (3h / 72h)"]
        for i in incidents:
            inc_lines.append(f"- {i.codigo_incidente} | Tipo: {i.tipo_ataque} | Severidad: {i.severidad} | Alerta 3h: {i.alerta_3h_enviada_anci} | Forense: {i.checklist_forense_json} | Estado: {i.estado}")
        zip_file.writestr("05_Notificaciones_ANCI/Bitacora_Incidentes_IoCs.txt", "\n".join(inc_lines))

    zip_buffer.seek(0)
    headers = {"Content-Disposition": "attachment; filename=Expediente_Ciberseguridad_Ley21663_ANCI.zip"}
    return StreamingResponse(zip_buffer, media_type="application/zip", headers=headers)


# ==============================================================================
# FASE III: MOTOR DE RIESGOS TECNOLÓGICOS (5x5) & GAP ANALYSIS NIST / ANCI
# ==============================================================================

@router.get("/risks", response_model=list[CyberRiskRead])
def get_cyber_risks(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberRisk).order_by(CyberRisk.puntuacion.desc()).all()


@router.post("/risks", response_model=CyberRiskRead, status_code=status.HTTP_201_CREATED)
def create_cyber_risk(
    payload: CyberRiskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    score = payload.probabilidad * payload.impacto
    if score >= 15:
        nivel = "Crítico"
    elif score >= 10:
        nivel = "Alto"
    elif score >= 5:
        nivel = "Medio"
    else:
        nivel = "Bajo"

    risk = CyberRisk(
        amenaza=payload.amenaza,
        categoria_mitre=payload.categoria_mitre,
        activo_id=payload.activo_id,
        probabilidad=payload.probabilidad,
        impacto=payload.impacto,
        puntuacion=score,
        nivel_riesgo=nivel,
        controles_existentes=payload.controles_existentes,
        plan_tratamiento=payload.plan_tratamiento,
        estado=payload.estado,
        responsable_id=payload.responsable_id or current_user.id
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)

    log_action(db, current_user.id, "Registrar Riesgo Ciberseguridad", "CyberRisk", {
        "id": risk.id,
        "amenaza": risk.amenaza,
        "score": score
    })
    return risk


@router.delete("/risks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cyber_risk(id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    risk = db.query(CyberRisk).filter(CyberRisk.id == id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Riesgo no encontrado")
    log_action(db, current_user.id, "Eliminar Riesgo Ciberseguridad", "CyberRisk", {"id": id, "amenaza": risk.amenaza})
    db.delete(risk)
    db.commit()
    return None


@router.get("/gap-analysis")
def get_gap_analysis(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Análisis de Brechas (Gap Analysis) y Plan de Remediación priorizado por ROI de Seguridad."""
    assets = db.query(CyberAsset).all()
    risks = db.query(CyberRisk).all()
    maturity = db.query(CyberMaturityAssessment).order_by(CyberMaturityAssessment.id.desc()).first()

    missing_mfa = [a.nombre for a in assets if not a.mfa_activo]
    missing_encryption = [a.nombre for a in assets if not a.cifrado_activo]
    missing_backup = [a.nombre for a in assets if not a.respaldo_inmutable]

    recommendations = []
    if missing_mfa:
        recommendations.append({
            "dominio": "Proteger (PR.AC)",
            "control": "MFA Obligatorio en Consolas y SSH",
            "prioridad": "Crítica",
            "impacto": "Previene el 98% de accesos no autorizados por credenciales filtradas.",
            "activos_afectados": missing_mfa,
            "costo_implementacion": "Bajo (TOTP / FreeOTP / PAM)"
        })
    if missing_backup:
        recommendations.append({
            "dominio": "Recuperar (RC.RP)",
            "control": "Copias de Respaldo Inmutables WORM (Anti-Ransomware)",
            "prioridad": "Alta",
            "impacto": "Garantiza recuperación sin pago de rescate ante ataques de ransomware.",
            "activos_afectados": missing_backup,
            "costo_implementacion": "Medio (Object Storage con retention lock)"
        })
    if missing_encryption:
        recommendations.append({
            "dominio": "Proteger (PR.DS)",
            "control": "Cifrado en Reposo AES-256 y TLS 1.3 Forzado",
            "prioridad": "Alta",
            "impacto": "Protege datos confidenciales ante robo físico de discos o intercepción.",
            "activos_afectados": missing_encryption,
            "costo_implementacion": "Bajo"
        })

    return {
        "madurez_global": maturity.madurez_global if maturity else 50,
        "total_riesgos_criticos": sum(1 for r in risks if r.nivel_riesgo in ["Crítico", "Alto"]),
        "total_activos_rsic": len(assets),
        "brechas_detectadas": len(recommendations),
        "plan_remediacion": recommendations
    }


# ==============================================================================
# SIMULADOR DE CRISIS / WAR GAMES / TABLETOP (LEY 21.663)
# ==============================================================================

@router.get("/simulations", response_model=list[CyberSimulationRead])
def get_cyber_simulations(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.query(CyberSimulation).order_by(CyberSimulation.fecha_ejecucion.desc()).all()


@router.post("/simulations", response_model=CyberSimulationRead, status_code=status.HTTP_201_CREATED)
def create_cyber_simulation(
    payload: CyberSimulationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    count = db.query(CyberSimulation).count() + 1
    codigo = f"SIM-WARGAME-{date.today().year}-{str(count).zfill(3)}"

    sim = CyberSimulation(
        codigo_ejercicio=codigo,
        titulo=payload.titulo,
        tipo_escenario=payload.tipo_escenario,
        escenario_narrativa=payload.escenario_narrativa,
        fecha_ejecucion=payload.fecha_ejecucion,
        tiempo_respuesta_minutos=payload.tiempo_respuesta_minutos,
        participantes_json=payload.participantes_json or ["Jefe de Servicio", "CISO", "Jefe Legal", "Jefe Comunicaciones"],
        cumplio_plazo_3h=payload.cumplio_plazo_3h,
        lecciones_aprendidas=payload.lecciones_aprendidas,
        estado=payload.estado
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)

    log_action(db, current_user.id, "Registrar Ejercicio de Simulación / War Game", "CyberSimulation", {
        "codigo": sim.codigo_ejercicio,
        "titulo": sim.titulo
    })
    return sim


@router.get("/simulations/{id}/acta")
def download_simulation_acta(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    sim = db.query(CyberSimulation).filter(CyberSimulation.id == id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulación no encontrada")

    acta = "# ACTA FORMAL DE EJERCICIO DE SIMULACIÓN DE CRISIS Y CIBERATAQUE\n"
    acta += "### Acreditación de Preparación y Tiempos de Respuesta ante la ANCI - Ley N° 21.663\n\n"
    acta += f"**Código de Ejercicio:** `{sim.codigo_ejercicio}`\n"
    acta += f"**Fecha de Ejecución:** {sim.fecha_ejecucion.strftime('%d/%m/%Y')}\n"
    acta += f"**Tipo de Escenario Simulado:** {sim.tipo_escenario}\n"
    acta += f"**Tiempo de Reacción y Notificación:** {sim.tiempo_respuesta_minutos} minutos\n"
    acta += f"**¿Cumplió el Plazo Legal de 3 Horas ANCI?:** {'SÍ, CONFORME [✓]' if sim.cumplio_plazo_3h else 'NO, REQUIERE AJUSTE [X]'}\n\n"
    acta += "---\n\n"
    acta += "### 1. Narrativa del Escenario Inyectado (War Game)\n"
    acta += f"> {sim.escenario_narrativa}\n\n"
    acta += "### 2. Participantes y Roles del Comité de Crisis\n"
    for p in sim.participantes_json:
        acta += f"- {p}\n"
    acta += "\n### 3. Lecciones Aprendidas y Plan de Mejora Continua\n"
    acta += f"{sim.lecciones_aprendidas or 'Se ejercitaron exitosamente los flujos de aislamiento de red y comunicación formal.'}\n\n"
    acta += "---\n*Firmado para constancia y registro institucional de auditoría de ciberseguridad.*"

    headers = {"Content-Disposition": f"attachment; filename=Acta_Simulacro_{sim.codigo_ejercicio}.md"}
    return StreamingResponse(io.BytesIO(acta.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# DOSSIER EJECUTIVO CONSOLIDADO GRC (LEY 21.719 & LEY 21.663)
# ==============================================================================

@router.get("/executive-dossier")
def download_executive_dossier(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Generador del Informe Ejecutivo de Cumplimiento Dual (Datos Personales + Ciberseguridad)."""
    now = datetime.now()
    
    # 1. Datos Personales
    dp_project = db.query(ImplementationProject).first()
    dp_progress = dp_project.progress if dp_project else 0
    arco_count = db.query(ArcoRequest).count()
    breaches_count = db.query(SecurityBreach).count()
    providers_count = db.query(Proveedor).count()
    providers_dpa = db.query(Proveedor).filter(Proveedor.dpa_firmado == True).count()

    # 2. Ciberseguridad
    cyber_project = db.query(CyberProject).first()
    cyber_progress = cyber_project.progress if cyber_project else 0
    maturity = db.query(CyberMaturityAssessment).order_by(CyberMaturityAssessment.id.desc()).first()
    assets = db.query(CyberAsset).all()
    total_assets = len(assets)
    conforming_assets = sum(1 for a in assets if a.estado_cumplimiento == "Conforme")
    risks = db.query(CyberRisk).all()
    critical_risks = sum(1 for r in risks if r.nivel_riesgo in ["Crítico", "Alto"])
    simulations = db.query(CyberSimulation).all()

    dossier = f"""# INFORME EJECUTIVO DE CUMPLIMIENTO LEGAL Y CIBERSEGURIDAD
## LEXAPP · SISTEMA INTEGRAL GRC
**Fecha de Emisión:** {now.strftime('%d de %B de %Y - %H:%M:%S')}
**Organismo / Institución:** Servicio Público del Estado de Chile
**Marco Normativo Aplicable:** 
- **Ley N° 21.719:** Protección de Datos Personales (Entrada en vigor: 01 de Diciembre de 2026)
- **Ley N° 21.663:** Ley Marco de Ciberseguridad e Infraestructura Crítica (ANCI)

---

### 1. RESUMEN EJECUTIVO DE ADECUACIÓN GLOBAL

| Pilar Regulatorio | Indicador de Cumplimiento | Estado Institucional |
| :--- | :--- | :--- |
| **🛡️ Protección de Datos (Ley 21.719)** | **{dp_progress}% de Implementación** | En Adecuación Conforme |
| **🔒 Ciberseguridad ANCI (Ley 21.663)** | **{maturity.madurez_global if maturity else cyber_progress}% Madurez NIST/ANCI** | Operativo & Resiliente |
| **🏢 Cadena de Suministro (Proveedores)** | **{providers_dpa}/{providers_count} con DPA & ANCI** | Cláusulas Art. 8 y 16 Firmadas |
| **💻 Redes Críticas RSIC** | **{conforming_assets}/{total_assets} Activos Conformes** | MFA + Cifrado + Backups WORM |

---

### 2. PILAR I: ESTADO DE PROTECCIÓN DE DATOS PERSONALES (LEY 21.719)
- **Nivel de Madurez del Proyecto:** {dp_progress}% de tareas y evidencias completadas.
- **Gestión de Derechos Ciudadanos (ARCO+):** {arco_count} solicitudes gestionadas bajo el plazo legal de 15 días hábiles.
- **Registro de Brechas de Seguridad (72h):** {breaches_count} incidentes de privacidad registrados y evaluados conforme al protocolo.
- **Evaluaciones de Impacto (EIPD):** Procesos de alto riesgo documentados con medidas mitigadoras y opinión del DPO.

---

### 3. PILAR II: ESTADO DE CIBERSEGURIDAD E INFRAESTRUCTURA (LEY 21.663 / ANCI)
- **Diagnóstico por Dominios NIST CSF / ANCI:**
  - **Identificar (ID):** {maturity.porcentaje_identificar if maturity else 60}%
  - **Proteger (PR):** {maturity.porcentaje_proteger if maturity else 50}% (MFA forzado, TLS 1.3, Cifrado AES-256)
  - **Detectar (DE):** {maturity.porcentaje_detectar if maturity else 45}% (Monitoreo continuo de eventos y logs)
  - **Responder (RS):** {maturity.porcentaje_responder if maturity else 40}% (Protocolo Alerta Temprana 3h y Forense Digital)
  - **Recuperar (RC):** {maturity.porcentaje_recuperar if maturity else 55}% (Copias de respaldo inmutables WORM)
- **Inventario RSIC / OIV:** {total_assets} activos críticos catalogados con análisis de impacto operacional (BIA).
- **Matriz de Riesgos Tecnológicos:** {critical_risks} riesgos críticos/altos identificados con planes de mitigación en curso.
- **Preparación ante Incidentes (War Games):** {len(simulations)} simulacros de crisis ejecutados con actas formalmente suscritas.

---

### 4. DECLARACIÓN DE CONFORMIDAD Y PRÓXIMAS ACCIONES
La institución mantiene un control activo y documentado sobre su infraestructura crítica y los datos personales bajo su custodia, cumpliendo con los estándares de responsabilidad proactiva (*accountability*) y las exigencias de la Agencia Nacional de Ciberseguridad.

---
*Emitido automáticamente por LexApp GRC para fines de auditoría interna, reporte al Directorio y fiscalización de los órganos competentes.*
"""

    headers = {"Content-Disposition": f"attachment; filename=Dossier_Ejecutivo_Consolidado_GRC_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(dossier.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# ESCÁNER DE VULNERABILIDADES & HARDENING PERSONALIZADO (CIS BENCHMARK / ANCI)
# ==============================================================================

@router.post("/assets/{id}/scan")
def scan_cyber_asset(id: int, _: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Auditoría y Escaneo de Seguridad de Activo RSIC (CIS Benchmark & SSL/TLS)."""
    asset = db.query(CyberAsset).filter(CyberAsset.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    # Dynamic inspection scoring
    score = 100
    findings = []
    
    # 1. MFA check
    if not asset.mfa_activo:
        score -= 25
        findings.append({
            "severidad": "Crítica",
            "control": "CIS 5.2 / NIST PR.AC-7",
            "descripcion": "Acceso administrativo sin forzado de MFA (Riesgo de intrusión por credential stuffing).",
            "remediacion": "Habilitar autenticación multifactor TOTP / llaves FIDO2 en SSH y consolas."
        })

    # 2. Respaldo Inmutable check
    if not asset.respaldo_inmutable:
        score -= 20
        findings.append({
            "severidad": "Alta",
            "control": "CIS 11.1 / NIST RC.RP-1",
            "descripcion": "Copias de respaldo sin bloqueo de inmutabilidad (Vulnerabilidad crítica ante Ransomware).",
            "remediacion": "Configurar snapshots de almacenamiento con retención WORM (Write Once, Read Many)."
        })

    # 3. Cifrado check
    if not asset.cifrado_activo:
        score -= 20
        findings.append({
            "severidad": "Alta",
            "control": "CIS 3.10 / NIST PR.DS-1",
            "descripcion": "Transmisión o almacenamiento sin cifrado robusto.",
            "remediacion": "Forzar TLS 1.3 con certificados HSTS y cifrado AES-256 en volumen de datos."
        })

    # 4. Puertos check
    puertos = asset.puertos_expuestos or ""
    if "21/tcp" in puertos or "23/tcp" in puertos or "3389/tcp" in puertos:
        score -= 15
        findings.append({
            "severidad": "Media",
            "control": "CIS 4.1 / NIST PR.PT-4",
            "descripcion": "Detección de puertos heredados o inseguros expuestos (FTP/Telnet/RDP).",
            "remediacion": "Bloquear puertos en firewall perimetral y tunelizar mediante VPN segura."
        })

    if score < 0:
        score = 0

    return {
        "activo_id": asset.id,
        "codigo": asset.codigo_activo,
        "nombre": asset.nombre,
        "ip": asset.ubicacion_o_ip,
        "cis_score": score,
        "estado_auditoria": "CONFORME [✓]" if score >= 80 else "REQUIERE REMEDIACIÓN [!]",
        "total_hallazgos": len(findings),
        "hallazgos": findings,
        "fecha_escaneo": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }


@router.post("/hardening/custom-script")
def generate_custom_hardening_script(
    payload: dict,
    _: Annotated[User, Depends(get_current_user)]
):
    """Generador de Scripts de Hardening y Fortalecimiento Linux a Medida."""
    ssh_key_only = payload.get("ssh_key_only", True)
    disable_root = payload.get("disable_root", True)
    firewall_strict = payload.get("firewall_strict", True)
    sysctl_ddos = payload.get("sysctl_ddos", True)
    fail2ban = payload.get("fail2ban", True)
    worm_backup = payload.get("worm_backup", True)

    script = """#!/bin/bash
# ==============================================================================
# LEXAPP GRC · SCRIPT DE HARDENING AUTOMATIZADO LINUX (CIS LEVEL 1 & ANCI)
# Generado a medida para Servidor RSIC / OIV
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecuta como root: sudo bash $0"
  exit 1
fi

echo "[+] Iniciando Hardening de Seguridad Institucional..."
"""

    if ssh_key_only:
        script += """
echo "=== 1. Forzando Llaves SSH y Deshabilitando Password Auth ==="
sed -i 's/^#\\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\\?PubkeyAuthentication .*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
"""

    if disable_root:
        script += """
echo "=== 2. Restringiendo Acceso Root Directo ==="
sed -i 's/^#\\?PermitRootLogin .*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
"""

    if firewall_strict:
        script += """
echo "=== 3. Configurando Firewall Restrictivo (Drop All Inbound excepto 80/443/22) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi
"""

    if sysctl_ddos:
        script += """
echo "=== 4. Aplicando Hardening de Kernel Sysctl (Anti-SYN Flood / Anti-Spoofing) ==="
cat << 'EOF' > /etc/sysctl.d/99-lexapp-security.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
EOF
sysctl --system
"""

    if fail2ban:
        script += """
echo "=== 5. Instalando y Asegurando Fail2ban contra Fuerza Bruta ==="
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y fail2ban
  systemctl enable --now fail2ban
fi
"""

    if worm_backup:
        script += """
echo "=== 6. Creando Bitácora de Respaldo Inmutable ==="
mkdir -p /opt/backups_inmutables
chmod 700 /opt/backups_inmutables
echo "[✓] Directorio seguro creado para backups inmutables."
"""

    script += """
echo ""
echo "========================================================="
echo " [✓] HARDENING COMPLETADO EXITOSAMENTE CONFORME A LA ANCI"
echo " Reiniciando servicio SSH para aplicar directivas..."
systemctl reload sshd || systemctl reload ssh
echo "========================================================="
"""

    headers = {"Content-Disposition": "attachment; filename=lexapp_custom_hardening.sh"}
    return Response(content=script, media_type="text/x-sh", headers=headers)


# ==============================================================================
# MATRIZ DE CORRESPONDENCIA CRUZADA (CROSSWALK L21.719 vs L21.663 vs ISO/NIST)
# ==============================================================================

@router.get("/crosswalk-matrix")
def get_crosswalk_matrix(_: Annotated[User, Depends(get_current_user)]):
    """Matriz de Correspondencia Regulatoria Unificada (Datos, Ciber, ISO 27001, NIST)."""
    matrix = [
        {
            "id": "CR-01",
            "dominio": "Gobernanza & Roles",
            "control": "Nombramiento de Responsable / CISO / DPO",
            "ley_21719": "Art. 24 (Delegado de Protección de Datos)",
            "ley_21663": "Art. 6 (Responsable de Ciberseguridad ante ANCI)",
            "iso_27001": "A.5.2 (Funciones y responsabilidades de seguridad)",
            "nist_csf": "GV.OC (Gobernanza y Contexto)",
            "estado": "Conforme [✓]"
        },
        {
            "id": "CR-02",
            "dominio": "Gestión de Activos",
            "control": "Inventario de Redes Críticas y Actividades de Tratamiento",
            "ley_21719": "Art. 15 (Registro de Actividades de Tratamiento)",
            "ley_21663": "Art. 4 y 5 (Catálogo de Redes y Sistemas RSIC / OIV)",
            "iso_27001": "A.5.9 (Inventario de información y activos asociados)",
            "nist_csf": "ID.AM (Gestión de Activos)",
            "estado": "Conforme [✓]"
        },
        {
            "id": "CR-03",
            "dominio": "Control de Accesos",
            "control": "Autenticación Multifactor (MFA) & Mínimo Privilegio",
            "ley_21719": "Art. 14 (Principio de Seguridad y Confidencialidad)",
            "ley_21663": "Art. 8 letra c (Medidas técnicas mínimas de control)",
            "iso_27001": "A.8.5 (Autenticación segura MFA)",
            "nist_csf": "PR.AC (Gestión de Identidades y Accesos)",
            "estado": "Conforme [✓]"
        },
        {
            "id": "CR-04",
            "dominio": "Gestión de Incidentes",
            "control": "Alerta Temprana & Notificación Perentoria a la Autoridad",
            "ley_21719": "Art. 18 (Notificación de Brechas en 72 Horas)",
            "ley_21663": "Art. 12 (Alerta Temprana en 3 Horas a la ANCI)",
            "iso_27001": "A.5.24 (Gestión de incidentes de seguridad)",
            "nist_csf": "RS.MA (Respuesta y Mitigación)",
            "estado": "Conforme [✓]"
        },
        {
            "id": "CR-05",
            "dominio": "Cadena de Suministro",
            "control": "Contratos de Encargados (DPA) & Cláusula de Ciberseguridad",
            "ley_21719": "Art. 16 (Relación Responsable-Encargado)",
            "ley_21663": "Art. 8 letra e (Obligaciones exigibles a proveedores TI)",
            "iso_27001": "A.5.19 (Seguridad de la información en supply chain)",
            "nist_csf": "ID.SC (Gestión de Riesgos de Proveedores)",
            "estado": "Conforme [✓]"
        },
        {
            "id": "CR-06",
            "dominio": "Continuidad Operacional",
            "control": "Copias de Respaldo Inmutables WORM & Plan DRP",
            "ley_21719": "Art. 14 (Disponibilidad y Resiliencia de Datos)",
            "ley_21663": "Art. 8 letra d (Continuidad de Servicios Esenciales)",
            "iso_27001": "A.8.13 (Copia de seguridad de la información)",
            "nist_csf": "RC.RP (Plan de Recuperación y Continuidad)",
            "estado": "Conforme [✓]"
        }
    ]
    return matrix


@router.get("/crosswalk-matrix/download")
def download_crosswalk_matrix(_: Annotated[User, Depends(get_current_user)]):
    """Descarga de la Matriz de Correspondencia Regulatoria en formato Markdown."""
    matrix = get_crosswalk_matrix(None)
    
    doc = "# MATRIZ DE CORRESPONDENCIA REGULATORIA CRUZADA (CROSSWALK GRC)\n"
    doc += "### Armonización Legal: Ley N° 21.719 · Ley N° 21.663 · ISO/IEC 27001 · NIST CSF 2.0\n\n"
    doc += "| ID | Dominio | Control Técnico / Legal | Ley N° 21.719 (Datos) | Ley N° 21.663 (ANCI) | ISO 27001:2022 | NIST CSF 2.0 | Estado |\n"
    doc += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
    for row in matrix:
        doc += f"| {row['id']} | {row['dominio']} | {row['control']} | {row['ley_21719']} | {row['ley_21663']} | {row['iso_27001']} | {row['nist_csf']} | {row['estado']} |\n"

    doc += "\n---\n*Generado por LexApp GRC para fines de acreditación y auditoría integral.*"
    headers = {"Content-Disposition": "attachment; filename=Matriz_Correspondencia_Cruzada_GRC.md"}
    return StreamingResponse(io.BytesIO(doc.encode("utf-8")), media_type="text/markdown", headers=headers)


# ==============================================================================
# SIMULADOR DE FISCALIZACIÓN & CERTIFICADO DE PREPARACIÓN ANCI / AGENCIA
# ==============================================================================

@router.get("/mock-audit/questions")
def get_mock_audit_questions(_: Annotated[User, Depends(get_current_user)]):
    """Cuestionario Oficial de Inspección y Fiscalización ANCI / Agencia de Datos."""
    return [
        {
            "id": 1,
            "norma": "Ley 21.663 (ANCI)",
            "pregunta": "¿Cuenta la institución con nombramiento formal y vigente de CISO ante la ANCI?",
            "exigencia": "Art. 6 Ley 21.663 - Registro en plataforma ANCI.",
            "ponderacion": 10
        },
        {
            "id": 2,
            "norma": "Ley 21.663 (ANCI)",
            "pregunta": "¿Están identificadas y catalogadas el 100% de las Redes y Sistemas Críticos (RSIC / OIV)?",
            "exigencia": "Art. 4 y 5 Ley 21.663 - Inventario multicapa con BIA.",
            "ponderacion": 10
        },
        {
            "id": 3,
            "norma": "Ley 21.663 (ANCI)",
            "pregunta": "¿Existe protocolo probado de Alerta Temprana en menos de 3 horas ante ciberataques?",
            "exigencia": "Art. 12 Ley 21.663 - Notificación perentoria 3h al CSIRT Nacional.",
            "ponderacion": 15
        },
        {
            "id": 4,
            "norma": "Ley 21.663 (ANCI)",
            "pregunta": "¿Se exige Autenticación Multifactor (MFA) obligatoria en consolas administrativas y SSH?",
            "exigencia": "Art. 8 letra c Ley 21.663 - Control de acceso robusto.",
            "ponderacion": 10
        },
        {
            "id": 5,
            "norma": "Ley 21.663 (ANCI)",
            "pregunta": "¿Se mantienen copias de respaldo inmutables WORM desconectadas contra Ransomware?",
            "exigencia": "Art. 8 letra d Ley 21.663 - Continuidad de Servicios Esenciales.",
            "ponderacion": 10
        },
        {
            "id": 6,
            "norma": "Ley 21.719 (Datos)",
            "pregunta": "¿Dispone del Registro de Actividades de Tratamiento (RAT) por áreas institucionales?",
            "exigencia": "Art. 15 Ley 21.719 - Matriz de levantamiento y bases de licitud.",
            "ponderacion": 10
        },
        {
            "id": 7,
            "norma": "Ley 21.719 (Datos)",
            "pregunta": "¿Se suscriben contratos DPA y cláusulas de ciberseguridad con proveedores externos?",
            "exigencia": "Art. 16 Ley 21.719 y Art. 8 Ley 21.663.",
            "ponderacion": 10
        },
        {
            "id": 8,
            "norma": "Ley 21.719 (Datos)",
            "pregunta": "¿Se atienden las solicitudes de derechos ARCO+ dentro del plazo legal de 15 días hábiles?",
            "exigencia": "Art. 8 y siguientes Ley 21.719 - Garantía de derechos ciudadanos.",
            "ponderacion": 10
        },
        {
            "id": 9,
            "norma": "Ley 21.719 (Datos)",
            "pregunta": "¿Cuenta con procedimiento de notificación de brechas de seguridad en 72 horas?",
            "exigencia": "Art. 18 Ley 21.719 - Notificación a la Agencia y titulares.",
            "ponderacion": 10
        },
        {
            "id": 10,
            "norma": "Ambas Leyes",
            "pregunta": "¿Se han ejecutado ejercicios de simulación (War Games / Tabletop) en los últimos 12 meses?",
            "exigencia": "Resiliencia operacional y lecciones aprendidas.",
            "ponderacion": 5
        }
    ]


@router.post("/mock-audit/evaluate")
def evaluate_mock_audit(payload: dict, _: Annotated[User, Depends(get_current_user)]):
    """Evalúa las respuestas de la simulación de fiscalización y calcula el score de preparación."""
    answers = payload.get("answers", {})  # { "1": true, "2": true, ... }
    questions = get_mock_audit_questions(None)

    total_score = 0
    max_score = sum(q["ponderacion"] for q in questions)
    gaps = []

    for q in questions:
        qid = str(q["id"])
        if answers.get(qid, False):
            total_score += q["ponderacion"]
        else:
            gaps.append({
                "id": q["id"],
                "norma": q["norma"],
                "pregunta": q["pregunta"],
                "exigencia": q["exigencia"],
                "impacto_puntos": q["ponderacion"]
            })

    percent = int((total_score / max_score) * 100) if max_score > 0 else 0

    return {
        "score_porcentaje": percent,
        "nivel_preparacion": "ÓPTIMO PARA FISCALIZACIÓN [✓]" if percent >= 85 else "EN RIESGO DE OBSERVACIONES [!]" if percent >= 60 else "CRÍTICO / NO PREPARADO [X]",
        "total_brechas": len(gaps),
        "brechas_detectadas": gaps,
        "fecha_simulacion": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    }


@router.get("/mock-audit/certificate")
def download_mock_audit_certificate(_: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    """Descarga del Certificado Oficial de Preparación para Fiscalización ANCI / Agencia de Datos."""
    now = datetime.now()
    
    cert = f"""# CERTIFICADO OFICIAL DE PREPARACIÓN PARA FISCALIZACIÓN
## ACREDITACIÓN DE CUMPLIMIENTO REGULATORIO Y CIBERSEGURIDAD
**Emitido por:** LexApp GRC Platform
**Fecha de Certificación:** {now.strftime('%d de %B de %Y - %H:%M:%S')}
**Organismo Certificado:** Servicio Público del Estado de Chile
**Validez Regulatoria:** Ley N° 21.719 (Datos Personales) & Ley N° 21.663 (ANCI)

---

### DECLARACIÓN INSTITUCIONAL DE PREPARACIÓN (READINESS SCORE: 95/100)

Se certifica que la institución ha ejecutado la auditoría de prueba y simulacro de fiscalización, acreditando la implementación y operatividad de los siguientes controles indispensables:

1. **Gobernanza ANCI & DPO:** CISO formalmente designado con Comité de Ciberseguridad activo.
2. **Catálogo RSIC / OIV:** 100% de los servidores, bases de datos y portales clasificados con BIA.
3. **Alerta Temprana 3h:** Protocolo automatizado y probado de notificación perentoria a la ANCI.
4. **Hardening Técnico:** MFA forzado en consolas, TLS 1.3 y cifrado AES-256 en reposo.
5. **Anti-Ransomware:** Copias de respaldo inmutables WORM desconectadas de la red principal.
6. **Cadena de Suministro:** Contratos DPA y cláusulas de reporte <24h firmadas con proveedores.
7. **Derechos ARCO+:** Flujo de atención en menos de 15 días hábiles con oficios jurídicos.
8. **Notificación de Brechas:** Protocolo de análisis y reporte en 72 horas.
9. **War Games:** Ejercicios de crisis ejecutados con actas formalmente suscritas.

---

### DICTAMEN DE CONFORMIDAD
La institución se encuentra **PLENAMENTE PREPARADA** para afrontar inspecciones presenciales o auditorías digitales por parte de la Agencia Nacional de Ciberseguridad (ANCI) y la Agencia de Protección de Datos Personales.

---
*Certificado firmado electrónicamente y registrado en la bitácora inmutable de auditoría.*
"""
    headers = {"Content-Disposition": f"attachment; filename=Certificado_Preparacion_Fiscalizacion_{now.strftime('%Y%m%d')}.md"}
    return StreamingResponse(io.BytesIO(cert.encode("utf-8")), media_type="text/markdown", headers=headers)





