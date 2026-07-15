import csv
import io
import unicodedata
from collections import defaultdict

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.modules import DataMappingEntry, ProcessingActivity
from app.schemas.matrix_catalog import (
    DataMappingCreate,
    DataMappingRead,
    DataMappingSummary,
    DataMappingUpdate,
    GenerateResult,
    ImportResult,
    ProcessingActivityCreate,
    ProcessingActivityRead,
    ProcessingActivityUpdate,
)

router = APIRouter()


OrgQuery = Query(default=settings.default_organization_id, min_length=1)


def get_record(db: Session, model, record_id: int, organization_id: str):
    record = db.query(model).filter(model.id == record_id, model.organization_id == organization_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    return record


@router.get("/data-mapping/summary", response_model=DataMappingSummary, tags=["Matriz de Levantamiento"])
def data_mapping_summary(organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> DataMappingSummary:
    base = db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id)
    return DataMappingSummary(
        total_registros=base.count(),
        total_sistemas=db.query(func.count(func.distinct(DataMappingEntry.system_name))).filter(DataMappingEntry.organization_id == organization_id).scalar() or 0,
        total_datos_sensibles=base.filter(DataMappingEntry.is_sensitive.is_(True)).count(),
        total_transferencias_internacionales=base.filter(DataMappingEntry.international_transfer.is_(True)).count(),
        total_perfilamiento=base.filter(DataMappingEntry.profiling.is_(True)).count(),
        registros_pendientes=base.filter(DataMappingEntry.validation_status == "pendiente").count(),
        registros_validados=base.filter(DataMappingEntry.validation_status == "validado").count(),
    )


@router.post("/data-mapping/import-csv", response_model=ImportResult, tags=["Matriz de Levantamiento"])
async def import_data_mapping_csv(
    file: UploadFile = File(...),
    organization_id: str = OrgQuery,
    db: Session = Depends(get_db),
) -> ImportResult:
    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    imported = 0
    bool_fields = {
        "is_sensitive",
        "is_part_of_database",
        "international_transfer",
        "third_party_communication",
        "automated_decisions",
        "profiling",
        "area_manager_approval",
    }
    for row in reader:
        payload = {}
        for field in DataMappingCreate.model_fields:
            value = row.get(field, "")
            if field in bool_fields:
                normalized = unicodedata.normalize("NFKD", str(value).strip().lower()).encode("ascii", "ignore").decode("ascii")
                payload[field] = normalized in {"1", "true", "si", "yes", "y"}
            else:
                payload[field] = value
        db.add(DataMappingEntry(**DataMappingCreate(**payload).model_dump(), organization_id=organization_id))
        imported += 1
    db.commit()
    return ImportResult(imported=imported)


@router.get("/data-mapping", response_model=list[DataMappingRead], tags=["Matriz de Levantamiento"])
def list_data_mapping(
    organization_id: str = OrgQuery,
    area: str | None = None,
    system_name: str | None = None,
    data_category: str | None = None,
    is_sensitive: bool | None = None,
    validation_status: str | None = None,
    db: Session = Depends(get_db),
) -> list[DataMappingEntry]:
    query = db.query(DataMappingEntry).filter(DataMappingEntry.organization_id == organization_id)
    if area:
        query = query.filter(DataMappingEntry.area == area)
    if system_name:
        query = query.filter(DataMappingEntry.system_name == system_name)
    if data_category:
        query = query.filter(DataMappingEntry.data_category == data_category)
    if is_sensitive is not None:
        query = query.filter(DataMappingEntry.is_sensitive.is_(is_sensitive))
    if validation_status:
        query = query.filter(DataMappingEntry.validation_status == validation_status)
    return query.order_by(DataMappingEntry.id.desc()).all()


@router.get("/data-mapping/{record_id}", response_model=DataMappingRead, tags=["Matriz de Levantamiento"])
def get_data_mapping(record_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    return get_record(db, DataMappingEntry, record_id, organization_id)


@router.post("/data-mapping", response_model=DataMappingRead, status_code=status.HTTP_201_CREATED, tags=["Matriz de Levantamiento"])
def create_data_mapping(payload: DataMappingCreate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    record = DataMappingEntry(**payload.model_dump(), organization_id=organization_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/data-mapping/{record_id}", response_model=DataMappingRead, tags=["Matriz de Levantamiento"])
def update_data_mapping(record_id: int, payload: DataMappingUpdate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    record = get_record(db, DataMappingEntry, record_id, organization_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/data-mapping/{record_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Matriz de Levantamiento"])
def delete_data_mapping(record_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> None:
    record = get_record(db, DataMappingEntry, record_id, organization_id)
    db.delete(record)
    db.commit()


@router.post("/processing-activities/generate-from-mapping", response_model=GenerateResult, tags=["Catalogo de Actividades"])
def generate_from_mapping(organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> GenerateResult:
    entries = (
        db.query(DataMappingEntry)
        .filter(DataMappingEntry.organization_id == organization_id, DataMappingEntry.validation_status == "validado")
        .all()
    )
    groups = defaultdict(list)
    for entry in entries:
        groups[(entry.treatment_purpose, entry.data_subject_universe, entry.internal_responsible, entry.system_name)].append(entry)

    created = 0
    for (_, _, _, _), grouped in groups.items():
        first = grouped[0]
        exists = (
            db.query(ProcessingActivity)
            .filter(
                ProcessingActivity.organization_id == organization_id,
                ProcessingActivity.treatment_purpose == first.treatment_purpose,
                ProcessingActivity.data_subject_universe == first.data_subject_universe,
                ProcessingActivity.responsible_or_processor == first.internal_responsible,
            )
            .first()
        )
        if exists:
            continue
        activity = ProcessingActivity(
            organization_id=organization_id,
            activity_name=f"{first.treatment_purpose} - {first.system_name}",
            responsible_or_processor=first.internal_responsible,
            data_categories=", ".join(sorted({item.data_category for item in grouped})),
            data_subject_universe=first.data_subject_universe,
            treatment_purpose=first.treatment_purpose,
            legal_basis=first.legal_basis,
            recipients=", ".join(sorted({item.internal_responsible for item in grouped})),
            international_transfer=any(item.international_transfer for item in grouped),
            retention_period=first.retention_period,
            data_source=first.data_source,
            automated_decisions=any(item.automated_decisions for item in grouped),
            profiling=any(item.profiling for item in grouped),
            source_mapping_entries=",".join(str(item.id) for item in grouped),
            publication_status="borrador",
            risk_level="Alto" if any(item.is_sensitive for item in grouped) else "Medio",
            status="Borrador",
        )
        db.add(activity)
        created += 1
    db.commit()
    return GenerateResult(created=created)


@router.get("/processing-activities/public-catalog", response_model=list[ProcessingActivityRead], tags=["Catalogo de Actividades"])
def public_catalog(organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    return (
        db.query(ProcessingActivity)
        .filter(
            ProcessingActivity.organization_id == organization_id,
            ProcessingActivity.publication_status.in_(["aprobado", "publicado"]),
        )
        .order_by(ProcessingActivity.id.desc())
        .all()
    )


@router.get("/processing-activities", response_model=list[ProcessingActivityRead], tags=["Catalogo de Actividades"])
def list_processing_activities(
    organization_id: str = OrgQuery,
    publication_status: str | None = None,
    risk_level: str | None = None,
    responsible_or_processor: str | None = None,
    international_transfer: bool | None = None,
    profiling: bool | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(ProcessingActivity).filter(ProcessingActivity.organization_id == organization_id)
    if publication_status:
        query = query.filter(ProcessingActivity.publication_status == publication_status)
    if risk_level:
        query = query.filter(ProcessingActivity.risk_level == risk_level)
    if responsible_or_processor:
        query = query.filter(ProcessingActivity.responsible_or_processor == responsible_or_processor)
    if international_transfer is not None:
        query = query.filter(ProcessingActivity.international_transfer.is_(international_transfer))
    if profiling is not None:
        query = query.filter(ProcessingActivity.profiling.is_(profiling))
    return query.order_by(ProcessingActivity.id.desc()).all()


@router.get("/processing-activities/{record_id}", response_model=ProcessingActivityRead, tags=["Catalogo de Actividades"])
def get_processing_activity(record_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    return get_record(db, ProcessingActivity, record_id, organization_id)


@router.post("/processing-activities", response_model=ProcessingActivityRead, status_code=status.HTTP_201_CREATED, tags=["Catalogo de Actividades"])
def create_processing_activity(payload: ProcessingActivityCreate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    record = ProcessingActivity(**payload.model_dump(), organization_id=organization_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/processing-activities/{record_id}", response_model=ProcessingActivityRead, tags=["Catalogo de Actividades"])
def update_processing_activity(record_id: int, payload: ProcessingActivityUpdate, organization_id: str = OrgQuery, db: Session = Depends(get_db)):
    record = get_record(db, ProcessingActivity, record_id, organization_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/processing-activities/{record_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Catalogo de Actividades"])
def delete_processing_activity(record_id: int, organization_id: str = OrgQuery, db: Session = Depends(get_db)) -> None:
    record = get_record(db, ProcessingActivity, record_id, organization_id)
    db.delete(record)
    db.commit()
