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

    model_config = ConfigDict(from_attributes=True)


class RiesgoCreate(BaseModel):
    matriz_id: int | None = None
    nivel: str = "Medio"
    descripcion: str
    puntuacion: int = 5


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

    model_config = ConfigDict(from_attributes=True)


class ProveedorCreate(BaseModel):
    nombre: str
    rut: str
    servicio: str
    fecha_contrato_inicio: date
    fecha_contrato_fin: date
    area_id: int | None = None


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
