from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    area_id: int | None = None
    rut: str | None = None
    cargo: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    password: str = ""
    area_id: int | None = None
    rut: str | None = None
    cargo: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Area Schemas
class AreaRead(BaseModel):
    id: int
    nombre: str
    descripcion: str
    responsable_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class AreaCreate(BaseModel):
    nombre: str
    descripcion: str = ""
    responsable_id: int | None = None


# Project Schemas
class ProjectRead(BaseModel):
    id: int
    name: str
    stage: str
    progress: int
    owner: str
    summary: str
    fecha_inicio: date
    fecha_fin: date
    estado: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Phase & Task Schemas
class TareaRead(BaseModel):
    id: int
    nombre: str
    descripcion: str
    fase_id: int
    area_responsable_id: int | None = None
    usuario_asignado_id: int | None = None
    fecha_inicio: date
    fecha_fin: date
    estado: str
    dependencia_de: int | None = None

    model_config = ConfigDict(from_attributes=True)


class TareaCreate(BaseModel):
    nombre: str
    descripcion: str = ""
    fase_id: int
    area_responsable_id: int | None = None
    usuario_asignado_id: int | None = None
    fecha_inicio: date
    fecha_fin: date
    estado: str = "Pendiente"
    dependencia_de: int | None = None


class FaseRead(BaseModel):
    id: int
    nombre: str
    orden: int
    fecha_inicio_plan: date
    fecha_fin_plan: date
    ponderacion: int
    resuelto_externamente: bool = False
    motivo_resuelto_externo: str = ""
    proyecto_id: int
    tareas: list[TareaRead] = []

    model_config = ConfigDict(from_attributes=True)


# Matrix Schemas
class MatrizLevantamientoRead(BaseModel):
    id: int
    area_id: int
    datos_json: list | dict
    completada: bool

    model_config = ConfigDict(from_attributes=True)


class MatrizLevantamientoCreate(BaseModel):
    area_id: int
    datos_json: list | dict
    completada: bool = False


# Risk Schemas
class RiesgoRead(BaseModel):
    id: int
    matriz_id: int | None = None
    nivel: str
    descripcion: str
    puntuacion: int
    probabilidad: int = 2
    impacto: int = 3
    requiere_eipd: bool = False

    model_config = ConfigDict(from_attributes=True)


class RiesgoCreate(BaseModel):
    matriz_id: int | None = None
    nivel: str = "Medio"
    descripcion: str
    puntuacion: int = 5
    probabilidad: int = 2
    impacto: int = 3
    requiere_eipd: bool = False


# Comment & Document Schemas
class ComentarioRead(BaseModel):
    id: int
    documento_id: int
    usuario_id: int
    texto: str
    fecha: datetime
    parent_id: int | None = None
    usuario: UserRead

    model_config = ConfigDict(from_attributes=True)


class ComentarioCreate(BaseModel):
    texto: str
    parent_id: int | None = None


class DocumentoRead(BaseModel):
    id: int
    tipo: str
    contenido: str
    version: str
    estado: str
    comentarios: list[ComentarioRead] = []

    model_config = ConfigDict(from_attributes=True)


class DocumentoCreate(BaseModel):
    tipo: str
    contenido: str = ""
    version: str = "1.0"
    estado: str = "borrador"


# Approval Flow Schemas
class FlujoAprobacionRead(BaseModel):
    id: int
    documento_id: int
    estado_actual: str
    usuario_origen_id: int | None = None
    usuario_destino_id: int | None = None
    fecha: datetime
    usuario_origen: UserRead | None = None
    usuario_destino: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


# Provider Schemas
class ProveedorRead(BaseModel):
    id: int
    nombre: str
    rut: str
    servicio: str
    fecha_contrato_inicio: date
    fecha_contrato_fin: date
    area_id: int | None = None
    area: AreaRead | None = None
    criticidad_ciber: str = "Medio"
    clausula_anci_firmada: bool = True
    dpa_firmado: bool = True
    pais_alojamiento: str = "Chile"
    sla_notificacion_horas: int = 24
    evaluacion_seguridad: str = "Conforme ISO 27001 / SOC 2"

    model_config = ConfigDict(from_attributes=True)


class ProveedorCreate(BaseModel):
    nombre: str
    rut: str
    servicio: str
    fecha_contrato_inicio: date
    fecha_contrato_fin: date
    area_id: int | None = None
    criticidad_ciber: str = "Medio"
    clausula_anci_firmada: bool = True
    dpa_firmado: bool = True
    pais_alojamiento: str = "Chile"
    sla_notificacion_horas: int = 24
    evaluacion_seguridad: str = "Conforme ISO 27001 / SOC 2"


# Audit Log Schemas
class LogAuditoriaRead(BaseModel):
    id: int
    usuario_id: int | None = None
    accion: str
    entidad_afectada: str
    fecha_hora: datetime
    detalle_json: dict | list | None = None
    usuario: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


# ARCO+ Schemas (Ley 21.719)
class ArcoRequestRead(BaseModel):
    id: int
    folio: str
    tipo_derecho: str
    titular_nombre: str
    titular_rut: str
    titular_email: str
    fecha_ingreso: date
    dias_habiles_limite: int
    fecha_limite_legal: date
    estado: str
    descripcion_solicitud: str
    fundamento_respuesta: str = ""
    area_derivada_id: int | None = None
    responsable_asignado_id: int | None = None
    area_derivada: AreaRead | None = None
    responsable_asignado: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


class ArcoRequestCreate(BaseModel):
    tipo_derecho: str
    titular_nombre: str
    titular_rut: str
    titular_email: str
    descripcion_solicitud: str
    area_derivada_id: int | None = None
    responsable_asignado_id: int | None = None


class ArcoRequestUpdate(BaseModel):
    estado: str
    fundamento_respuesta: str = ""
    area_derivada_id: int | None = None
    responsable_asignado_id: int | None = None


# Security Breach Schemas
class SecurityBreachRead(BaseModel):
    id: int
    codigo_incidente: str
    fecha_deteccion: datetime
    fecha_limite_notificacion: datetime
    tipo_incidente: str
    gravedad: str
    descripcion: str
    datos_afectados: str
    cantidad_titulares_afectados: int
    medidas_contencion: str
    notificado_agencia: bool
    fecha_notificacion_agencia: datetime | None = None
    notificado_titulares: bool
    estado: str
    reportado_por_id: int | None = None
    reportado_por: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


class SecurityBreachCreate(BaseModel):
    tipo_incidente: str
    gravedad: str = "Alta"
    descripcion: str
    datos_afectados: str
    cantidad_titulares_afectados: int = 0
    medidas_contencion: str = ""


class SecurityBreachUpdate(BaseModel):
    estado: str
    medidas_contencion: str
    notificado_agencia: bool = False
    notificado_titulares: bool = False


# Impact Assessment Schemas (EIPD / DPIA)
class ImpactAssessmentRead(BaseModel):
    id: int
    titulo: str
    area_id: int
    proceso_relacionado: str
    motivo_alto_riesgo: str
    analisis_necesidad: str
    riesgos_derechos: str
    medidas_mitigacion: str
    riesgo_residual: str
    opinion_dpo: str
    estado: str
    area: AreaRead | None = None

    model_config = ConfigDict(from_attributes=True)


class ImpactAssessmentCreate(BaseModel):
    titulo: str
    area_id: int
    proceso_relacionado: str
    motivo_alto_riesgo: str
    analisis_necesidad: str = ""
    riesgos_derechos: str = ""
    medidas_mitigacion: str = ""
    riesgo_residual: str = "Aceptable"
    opinion_dpo: str = ""
    estado: str = "Borrador"


# Backward Compatibility Schemas
class ActivityRead(BaseModel):
    id: int
    name: str
    area: str
    purpose: str
    legal_basis: str
    risk_level: str

    model_config = ConfigDict(from_attributes=True)


class ActivityCreate(BaseModel):
    name: str
    area: str
    purpose: str
    legal_basis: str
    risk_level: str = "Medio"


class FindingRead(BaseModel):
    id: int
    title: str
    severity: str
    status: str
    recommendation: str

    model_config = ConfigDict(from_attributes=True)


class FindingCreate(BaseModel):
    title: str
    severity: str = "Media"
    status: str = "Abierto"
    recommendation: str


class ConsentRead(BaseModel):
    id: int
    data_subject: str
    channel: str
    purpose: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class ConsentCreate(BaseModel):
    data_subject: str
    channel: str
    purpose: str
    status: str = "Vigente"


class TicketRead(BaseModel):
    id: int
    subject: str
    category: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class TicketCreate(BaseModel):
    subject: str
    category: str
    status: str = "Nuevo"


# ==============================================================================
# SCHEMAS DE CIBERSEGURIDAD (LEY 21.663 / ANCI)
# ==============================================================================

class CyberTareaRead(BaseModel):
    id: int
    nombre: str
    descripcion: str
    fase_id: int
    area_responsable_id: int | None = None
    area_responsable: AreaRead | None = None
    usuario_asignado_id: int | None = None
    usuario_asignado: UserRead | None = None
    fecha_inicio: date
    fecha_fin: date
    estado: str
    resuelto_externamente: bool = False
    estandar_asociado: str

    model_config = ConfigDict(from_attributes=True)


class CyberTareaCreate(BaseModel):
    nombre: str
    descripcion: str = ""
    fase_id: int
    area_responsable_id: int | None = None
    usuario_asignado_id: int | None = None
    fecha_inicio: date
    fecha_fin: date
    estado: str = "Pendiente"
    resuelto_externamente: bool = False
    estandar_asociado: str = "ANCI - Requisitos Mínimos"


class CyberFaseRead(BaseModel):
    id: int
    nombre: str
    orden: int
    descripcion: str
    fecha_inicio_plan: date
    fecha_fin_plan: date
    ponderacion: int
    activo: bool
    resuelto_externamente: bool
    nota_resolucion_externa: str
    proyecto_id: int
    tareas: list[CyberTareaRead] = []

    model_config = ConfigDict(from_attributes=True)


class CyberProjectRead(BaseModel):
    id: int
    name: str
    stage: str
    progress: int
    ciso_owner: str
    clasificacion_institucional: str
    resumen_ejecutivo: str
    fecha_inicio: date
    fecha_fin: date
    estado: str
    fases: list[CyberFaseRead] = []

    model_config = ConfigDict(from_attributes=True)


class CyberAssetRead(BaseModel):
    id: int
    codigo_activo: str
    nombre: str
    tipo: str
    capa_tecnologica: str = "Servidor"
    criticidad: str
    servicio_esencial: str
    ubicacion_o_ip: str
    puertos_expuestos: str = "443/tcp, 22/tcp"
    version_so: str = "Ubuntu 24.04 LTS"
    impacto_caida_servicio: str = "Interrupción de trámite en línea"
    dependencias_ids: list = []
    area_responsable_id: int | None = None
    area_responsable: AreaRead | None = None
    cifrado_activo: bool
    mfa_activo: bool
    respaldo_inmutable: bool
    estado_cumplimiento: str

    model_config = ConfigDict(from_attributes=True)


class CyberAssetCreate(BaseModel):
    codigo_activo: str | None = None
    nombre: str
    tipo: str = "Servidor Central"
    capa_tecnologica: str = "Servidor"
    criticidad: str = "Alto"
    servicio_esencial: str = ""
    ubicacion_o_ip: str = ""
    puertos_expuestos: str = "443/tcp, 22/tcp"
    version_so: str = "Ubuntu 24.04 LTS"
    impacto_caida_servicio: str = "Interrupción de trámite en línea"
    dependencias_ids: list = []
    area_responsable_id: int | None = None
    cifrado_activo: bool = True
    mfa_activo: bool = True
    respaldo_inmutable: bool = True
    estado_cumplimiento: str = "Conforme"


class CyberIncidentANCIRead(BaseModel):
    id: int
    codigo_incidente: str
    fecha_deteccion: datetime
    fecha_limite_alerta_3h: datetime
    fecha_limite_informe_72h: datetime
    tipo_ataque: str
    severidad: str
    afecta_servicio_esencial: bool
    descripcion: str
    sistemas_comprometidos: str
    medidas_contencion_aplicadas: str
    iocs_json: dict = {}
    checklist_forense_json: dict = {}
    tiempo_deteccion_minutos: int = 15
    alerta_3h_enviada_anci: bool
    fecha_alerta_3h_anci: datetime | None = None
    informe_72h_enviado_anci: bool
    fecha_informe_72h_anci: datetime | None = None
    estado: str
    reportado_por_id: int | None = None
    reportado_por: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


class CyberIncidentANCICreate(BaseModel):
    tipo_ataque: str
    severidad: str = "Alta"
    afecta_servicio_esencial: bool = True
    descripcion: str
    sistemas_comprometidos: str = ""
    medidas_contencion_aplicadas: str = ""
    iocs_json: dict = {}
    checklist_forense_json: dict = {}
    tiempo_deteccion_minutos: int = 15


class CyberIncidentANCIUpdate(BaseModel):
    estado: str
    medidas_contencion_aplicadas: str | None = None
    iocs_json: dict | None = None
    checklist_forense_json: dict | None = None
    alerta_3h_enviada_anci: bool = False
    informe_72h_enviado_anci: bool = False


class CyberMaturityAssessmentRead(BaseModel):
    id: int
    titulo: str
    fecha_evaluacion: date
    porcentaje_identificar: int
    porcentaje_proteger: int
    porcentaje_detectar: int
    porcentaje_responder: int
    porcentaje_recuperar: int
    madurez_global: int
    conclusiones_ciso: str
    estado: str

    model_config = ConfigDict(from_attributes=True)


class CyberMaturityAssessmentCreate(BaseModel):
    titulo: str
    porcentaje_identificar: int = 60
    porcentaje_proteger: int = 50
    porcentaje_detectar: int = 45
    porcentaje_responder: int = 40
    porcentaje_recuperar: int = 55
    conclusiones_ciso: str = ""


class CyberPolicyRead(BaseModel):
    id: int
    tipo: str
    titulo: str
    contenido: str
    version: str
    estado: str

    model_config = ConfigDict(from_attributes=True)


class CyberPolicyCreate(BaseModel):
    tipo: str
    titulo: str
    contenido: str
    version: str = "1.0"
    estado: str = "borrador"


class CyberRiskRead(BaseModel):
    id: int
    amenaza: str
    categoria_mitre: str
    activo_id: int | None = None
    activo: CyberAssetRead | None = None
    probabilidad: int
    impacto: int
    puntuacion: int
    nivel_riesgo: str
    controles_existentes: str
    plan_tratamiento: str
    estado: str
    responsable_id: int | None = None
    responsable: UserRead | None = None

    model_config = ConfigDict(from_attributes=True)


class CyberRiskCreate(BaseModel):
    amenaza: str
    categoria_mitre: str = "Acceso Inicial"
    activo_id: int | None = None
    probabilidad: int = 3
    impacto: int = 4
    controles_existentes: str = ""
    plan_tratamiento: str = ""
    estado: str = "Identificado"
    responsable_id: int | None = None


class CyberSimulationRead(BaseModel):
    id: int
    codigo_ejercicio: str
    titulo: str
    tipo_escenario: str
    escenario_narrativa: str
    fecha_ejecucion: date
    tiempo_respuesta_minutos: int
    participantes_json: list = []
    cumplio_plazo_3h: bool
    lecciones_aprendidas: str
    estado: str

    model_config = ConfigDict(from_attributes=True)


class CyberSimulationCreate(BaseModel):
    titulo: str
    tipo_escenario: str = "Ransomware & Extorsión Doble"
    escenario_narrativa: str
    fecha_ejecucion: date
    tiempo_respuesta_minutos: int = 45
    participantes_json: list = []
    cumplio_plazo_3h: bool = True
    lecciones_aprendidas: str = ""
    estado: str = "Planificado"


class TrainingCampaignRead(BaseModel):
    id: int
    titulo: str
    tipo: str
    descripcion: str
    fecha_inicio: date
    fecha_fin: date
    total_convocados: int
    total_capacitados: int
    porcentaje_aprobacion: int
    tasa_clic_phishing: float
    estado: str
    instructor_o_plataforma: str
    area_responsable_id: int | None = None
    area_responsable: AreaRead | None = None

    model_config = ConfigDict(from_attributes=True)


class TrainingCampaignCreate(BaseModel):
    titulo: str
    tipo: str = "Protección de Datos Ley 21.719"
    descripcion: str = ""
    fecha_inicio: date
    fecha_fin: date
    total_convocados: int = 100
    total_capacitados: int = 0
    porcentaje_aprobacion: int = 0
    tasa_clic_phishing: float = 0.0
    estado: str = "Planificada"
    instructor_o_plataforma: str = "DPO / CISO Institucional"
    area_responsable_id: int | None = None



