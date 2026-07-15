from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReadMixin(BaseModel):
    id: int
    organization_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DataMappingBase(BaseModel):
    area: str
    system_name: str
    database_name: str = ""
    table_name: str = ""
    field_name: str
    data_category: str
    data_subject_universe: str
    is_sensitive: bool = False
    is_part_of_database: bool = True
    database_category: str = ""
    treatment_purpose: str
    legal_basis: str
    data_source: str
    international_transfer: bool = False
    third_party_communication: bool = False
    internal_responsible: str
    retention_period: str
    associated_platforms: str = ""
    access_roles: str = ""
    storage_location: str = ""
    automated_decisions: bool = False
    profiling: bool = False
    associated_risks: str = ""
    comments: str = ""
    area_manager_approval: bool = False
    area_manager_observations: str = ""
    validation_status: str = "pendiente"


class DataMappingCreate(DataMappingBase):
    pass


class DataMappingUpdate(BaseModel):
    area: str | None = None
    system_name: str | None = None
    database_name: str | None = None
    table_name: str | None = None
    field_name: str | None = None
    data_category: str | None = None
    data_subject_universe: str | None = None
    is_sensitive: bool | None = None
    is_part_of_database: bool | None = None
    database_category: str | None = None
    treatment_purpose: str | None = None
    legal_basis: str | None = None
    data_source: str | None = None
    international_transfer: bool | None = None
    third_party_communication: bool | None = None
    internal_responsible: str | None = None
    retention_period: str | None = None
    associated_platforms: str | None = None
    access_roles: str | None = None
    storage_location: str | None = None
    automated_decisions: bool | None = None
    profiling: bool | None = None
    associated_risks: str | None = None
    comments: str | None = None
    area_manager_approval: bool | None = None
    area_manager_observations: str | None = None
    validation_status: str | None = None


class DataMappingRead(DataMappingBase, ReadMixin):
    pass


class DataMappingSummary(BaseModel):
    total_registros: int
    total_sistemas: int
    total_datos_sensibles: int
    total_transferencias_internacionales: int
    total_perfilamiento: int
    registros_pendientes: int
    registros_validados: int


class ImportResult(BaseModel):
    imported: int


class ProcessingActivityBase(BaseModel):
    activity_name: str
    responsible_or_processor: str
    data_categories: str
    data_subject_universe: str
    treatment_purpose: str
    legal_basis: str
    legitimate_interest_detail: str = ""
    recipients: str = ""
    international_transfer: bool = False
    international_transfer_country: str = ""
    international_transfer_guarantees: str = ""
    retention_period: str
    data_source: str
    public_source: bool = False
    security_measures_reference: str = ""
    automated_decisions: bool = False
    profiling: bool = False
    profiling_logic: str = ""
    expected_consequences: str = ""
    source_mapping_entries: str = ""
    publication_status: str = "borrador"
    risk_level: str = "Medio"
    status: str = "Activo"


class ProcessingActivityCreate(ProcessingActivityBase):
    pass


class ProcessingActivityUpdate(BaseModel):
    activity_name: str | None = None
    responsible_or_processor: str | None = None
    data_categories: str | None = None
    data_subject_universe: str | None = None
    treatment_purpose: str | None = None
    legal_basis: str | None = None
    legitimate_interest_detail: str | None = None
    recipients: str | None = None
    international_transfer: bool | None = None
    international_transfer_country: str | None = None
    international_transfer_guarantees: str | None = None
    retention_period: str | None = None
    data_source: str | None = None
    public_source: bool | None = None
    security_measures_reference: str | None = None
    automated_decisions: bool | None = None
    profiling: bool | None = None
    profiling_logic: str | None = None
    expected_consequences: str | None = None
    source_mapping_entries: str | None = None
    publication_status: str | None = None
    risk_level: str | None = None
    status: str | None = None


class ProcessingActivityRead(ProcessingActivityBase, ReadMixin):
    pass


class GenerateResult(BaseModel):
    created: int
