import hashlib
import json
from datetime import datetime, date, timedelta
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.domain import (
    User, 
    ArcoRequest, 
    TratamientoDatos, 
    AuditLog, 
    CyberIncident, 
    CyberAsset, 
    CvdReport, 
    TelemetryEvent
)
from app.schemas.domain import (
    CvdReportRead, 
    CvdReportCreate, 
    TelemetryEventRead, 
    CitizenArcoSimulationRequest
)
from app.routers.arco import calculate_legal_deadline

router = APIRouter(prefix="/gateways", tags=["gateways"])


# ==============================================================================
# 1. SANDBOX PORTAL CIUDADANO ARCO+ (CLAVEÚNICA INBOUND GATEWAY)
# ==============================================================================

@router.post("/simulate-citizen-arco")
def simulate_citizen_arco(
    payload: CitizenArcoSimulationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Simula el ingreso de una solicitud ciudadana ARCO+ a través del Portal Ciudadano con ClaveÚnica."""
    now = datetime.now()
    count = db.query(ArcoRequest).count() + 1
    folio = f"ARCO-CU-{now.strftime('%Y%m')}-{count:03d}"
    
    fecha_limite = calculate_legal_deadline(now.date(), 15) # 15 días hábiles

    # Generar hash de prueba ciudadana
    hash_content = f"{folio}|{payload.titular_rut}|{payload.tipo_derecho}|{now.isoformat()}"
    hash_sha256 = hashlib.sha256(hash_content.encode("utf-8")).hexdigest()

    arco = ArcoRequest(
        folio=folio,
        titular_nombre=payload.titular_nombre,
        titular_rut=payload.titular_rut,
        titular_email=payload.titular_email,
        tipo_derecho=payload.tipo_derecho,
        tratamiento_id=payload.tratamiento_id,
        detalle_solicitud=payload.detalle_solicitud,
        fecha_ingreso=now.date(),
        fecha_limite_legal=fecha_limite,
        estado="Ingresada",
        prioridad="Alta",
        requiere_verificacion_identidad=False, # Ya verificado con ClaveÚnica
        area_responsable_id=current_user.area_id,
        asignado_a_id=current_user.id,
        hash_integridad=hash_sha256
    )
    db.add(arco)

    # Registrar evento de telemetría y auditoría
    telemetry = TelemetryEvent(
        fuente="Portal Ciudadano ClaveÚnica",
        suite="data_protection",
        tipo_evento="ARCO_CITIZEN_SUBMISSION",
        severidad="Alto",
        mensaje=f"Nueva solicitud ARCO+ [{folio}] recibida vía ClaveÚnica: {payload.tipo_derecho} de {payload.titular_nombre}.",
        payload_json=json.dumps({"folio": folio, "rut": payload.titular_rut, "derecho": payload.tipo_derecho}),
        accion_automatica="Temporizador legal de 15 días hábiles activado."
    )
    db.add(telemetry)

    audit = AuditLog(
        usuario=current_user.full_name,
        accion=f"Sandbox: Recepción Solicitud Ciudadana ARCO+ {folio}",
        tipo_entidad="ArcoRequest",
        entidad_id=0,
        detalle={"folio": folio, "derecho": payload.tipo_derecho, "titular": payload.titular_nombre, "canal": "ClaveÚnica"}
    )
    db.add(audit)
    db.commit()
    db.refresh(arco)

    return {
        "success": True,
        "message": f"Solicitud ciudadana recibida y radicada exitosamente con Folio {folio}.",
        "folio": folio,
        "fecha_limite_legal": fecha_limite.isoformat(),
        "plazo_dias_habiles": 15,
        "hash_sha256": hash_sha256
    }


# ==============================================================================
# 2. CANAL DE DIVULGACIÓN COORDINADA DE VULNERABILIDADES (CVD - ART. 12 ANCI)
# ==============================================================================

@router.get("/cvd-reports", response_model=List[CvdReportRead])
def get_cvd_reports(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Obtiene los reportes recibidos a través del Canal de Divulgación Coordinada de Vulnerabilidades."""
    return db.query(CvdReport).order_by(CvdReport.created_at.desc()).all()


@router.post("/simulate-cvd-report", response_model=CvdReportRead)
def simulate_cvd_report(
    payload: CvdReportCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Simula el reporte de una vulnerabilidad por parte de un investigador ético (CVD Gateway)."""
    now = datetime.now()
    count = db.query(CvdReport).count() + 1
    folio = f"CVD-ANCI-{now.strftime('%Y%m')}-{count:03d}"

    hash_content = f"{folio}|{payload.activo_afectado}|{payload.cvss_score}|{now.isoformat()}"
    hash_sha256 = hashlib.sha256(hash_content.encode("utf-8")).hexdigest()

    cvd = CvdReport(
        folio=folio,
        titulo=payload.titulo,
        investigador_alias=payload.investigador_alias,
        investigador_email=payload.investigador_email,
        activo_afectado=payload.activo_afectado,
        severidad=payload.severidad,
        cvss_score=payload.cvss_score,
        descripcion_tecnica=payload.descripcion_tecnica,
        poa_remediacion=payload.poa_remediacion,
        estado="Recibido",
        hash_evidencia=hash_sha256
    )
    db.add(cvd)

    # Telemetría de ciberseguridad
    telemetry = TelemetryEvent(
        fuente="Canal CVD Ético (Art. 12)",
        suite="cybersecurity",
        tipo_evento="CVD_VULNERABILITY_REPORTED",
        severidad="Crítico" if payload.cvss_score >= 9.0 else "Alto",
        mensaje=f"Reporte CVD recibido [{folio}]: {payload.titulo} en {payload.activo_afectado} (CVSS {payload.cvss_score}).",
        payload_json=json.dumps({"folio": folio, "cvss": payload.cvss_score, "activo": payload.activo_afectado}),
        accion_automatica="Notificación técnica enviada a bandeja CISO para verificación."
    )
    db.add(telemetry)

    audit = AuditLog(
        usuario=current_user.full_name,
        accion=f"Sandbox: Reporte de Vulnerabilidad Ética CVD {folio}",
        tipo_entidad="CvdReport",
        entidad_id=0,
        detalle={"folio": folio, "severidad": payload.severidad, "cvss": payload.cvss_score}
    )
    db.add(audit)
    db.commit()
    db.refresh(cvd)

    return cvd


@router.put("/cvd-reports/{report_id}/status")
def update_cvd_status(
    report_id: int,
    nuevo_estado: str,
    poa_remediacion: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Actualiza el estado de remediación de un reporte de vulnerabilidad CVD."""
    cvd = db.query(CvdReport).filter(CvdReport.id == report_id).first()
    if not cvd:
        raise HTTPException(status_code=404, detail="Reporte CVD no encontrado")

    cvd.estado = nuevo_estado
    if poa_remediacion:
        cvd.poa_remediacion = poa_remediacion

    db.commit()
    return {"success": True, "message": f"Reporte {cvd.folio} actualizado a {nuevo_estado}."}


# ==============================================================================
# 3. SIMULADOR DE INGESTA DE TELEMETRÍA OPEN SOURCE (PRESIDIO & WAZUH)
# ==============================================================================

@router.post("/simulate-presidio-scan")
def simulate_presidio_scan(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Simula un escaneo en vivo de Microsoft Presidio encontrando campos PII no anonimizados."""
    now = datetime.now()
    
    # Ingesta de telemetría Presidio
    telemetry = TelemetryEvent(
        fuente="Microsoft Presidio NLP",
        suite="data_protection",
        tipo_evento="PII_DISCOVERY_SCAN",
        severidad="Alto",
        mensaje="Presidio detectó 1.450 RUTs y correos electrónicos sin máscara de cifrado en la tabla 'solicitudes_historicas'.",
        payload_json=json.dumps({
            "entidades_detectadas": ["CL_RUT", "EMAIL_ADDRESS", "PERSON_NAME"],
            "total_registros_afectados": 1450,
            "confianza_nlp": "98.4%",
            "recomendacion": "Aplicar enmascaramiento con pg_anonymizer o cifrado HashiCorp Vault."
        }),
        accion_automatica="Alerta generada en matriz de riesgos y notificación al DPO."
    )
    db.add(telemetry)

    audit = AuditLog(
        usuario="Sistema Automático (Presidio Engine)",
        accion="Escaneo NLP de PII Finalizado",
        tipo_entidad="TratamientoDatos",
        entidad_id=0,
        detalle={"registros_sensibles_hallados": 1450, "tipo": "RUT / PII"}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "fuente": "Microsoft Presidio (Open Source NLP)",
        "resultado": "1.450 registros PII detectados",
        "accion": "Telemetría ingestada exitosamente en el Hub de Privacidad.",
        "timestamp": now.isoformat()
    }


@router.post("/simulate-wazuh-alert")
def simulate_wazuh_alert(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    """Simula la llegada de un Webhook de Wazuh SIEM Nivel 12 (Ataque a Activo Crítico RSIC)."""
    now = datetime.now()
    count = db.query(CyberIncident).count() + 1
    codigo = f"INC-WAZUH-{now.strftime('%Y%m')}-{count:03d}"
    
    # Crear incidente automático con límite de 3h
    limite_3h = now + timedelta(hours=3)
    
    incidente = CyberIncident(
        codigo_incidente=codigo,
        titulo="[Wazuh SIEM L12] Detección de Ataque de Fuerza Bruta y Modificación FIM en Servidor BD",
        categoria="Intrusión / Acceso No Autorizado",
        severidad="Crítica",
        estado="Abierto",
        servicio_afectado="Servidor de Bases de Datos Producción (RSIC-01)",
        fecha_deteccion=now,
        fecha_limite_3h=limite_3h,
        descripcion="Wazuh XDR detectó 420 intentos fallidos de SSH seguidos de modificación de binarios en /usr/bin. Posible escalada de privilegios.",
        iocs_detectados=json.dumps({"ips_atacantes": ["198.51.100.77", "203.0.113.19"], "hash_malware": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}),
        acciones_tomadas="IPs bloqueadas automáticamente en Firewall perimetral mediante Active Response.",
        notificado_anci=False,
        notificado_titulares=False,
        impacto_operacional="Contenido en servidor aislado",
        lecciones_aprendidas="",
        registrado_por_id=current_user.id
    )
    db.add(incidente)

    # Telemetría Wazuh
    telemetry = TelemetryEvent(
        fuente="Wazuh SIEM / XDR",
        suite="cybersecurity",
        tipo_evento="WAZUH_CRITICAL_LEVEL_12",
        severidad="Crítico",
        mensaje=f"Alerta Crítica Wazuh: Intrusión detectada en Servidor BD. Incidente [{codigo}] generado con Alerta 3h.",
        payload_json=json.dumps({"codigo": codigo, "regla_wazuh": "5712 (SSHD Brute Force)", "nivel": 12}),
        accion_automatica="Cuenta regresiva perentoria de 3 horas para la ANCI iniciada."
    )
    db.add(telemetry)

    audit = AuditLog(
        usuario="Wazuh SOC Connector",
        accion=f"Ingesta Automática Incidente Crítico {codigo} (Alerta 3h)",
        tipo_entidad="CyberIncident",
        entidad_id=0,
        detalle={"codigo": codigo, "severidad": "Crítica", "alerta_3h": limite_3h.isoformat()}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "fuente": "Wazuh SIEM / XDR Connector",
        "codigo_incidente": codigo,
        "limite_3h": limite_3h.isoformat(),
        "mensaje": "Incidente registrado y temporizador ANCI <3 Horas activado."
    }


@router.get("/telemetry-feed", response_model=List[TelemetryEventRead])
def get_telemetry_feed(
    _: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    suite: str | None = Query(None)
):
    """Obtiene el feed consolidado de eventos de telemetría de herramientas Open Source."""
    q = db.query(TelemetryEvent)
    if suite:
        q = q.filter(TelemetryEvent.suite == suite)
    return q.order_by(TelemetryEvent.created_at.desc()).limit(30).all()
