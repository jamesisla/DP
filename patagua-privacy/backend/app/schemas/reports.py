from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReadMixin(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportSectionBase(BaseModel):
    section_type: str
    title: str
    content: str
    order_index: int = 0


class ReportSectionCreate(ReportSectionBase):
    pass


class ReportSectionUpdate(BaseModel):
    section_type: str | None = None
    title: str | None = None
    content: str | None = None
    order_index: int | None = None


class ReportSectionRead(ReportSectionBase):
    id: int
    report_id: int

    model_config = ConfigDict(from_attributes=True)


class FindingsReportBase(BaseModel):
    title: str
    version: str = "1.0"
    status: str = "borrador"
    executive_summary: str = ""
    main_conclusions: str = ""
    main_risks_summary: str = ""
    compliance_gaps_summary: str = ""
    article_14ter_score: int = 0
    global_risk_level: str = "Medio"
    generated_at: datetime | None = None
    approved_by: str = ""
    approved_at: datetime | None = None


class FindingsReportCreate(FindingsReportBase):
    sections: list[ReportSectionCreate] = Field(default_factory=list)


class FindingsReportUpdate(BaseModel):
    title: str | None = None
    version: str | None = None
    status: str | None = None
    executive_summary: str | None = None
    main_conclusions: str | None = None
    main_risks_summary: str | None = None
    compliance_gaps_summary: str | None = None
    article_14ter_score: int | None = None
    global_risk_level: str | None = None
    generated_at: datetime | None = None
    approved_by: str | None = None
    approved_at: datetime | None = None
    sections: list[ReportSectionCreate] | None = None


class FindingsReportRead(FindingsReportBase, ReadMixin):
    organization_id: str
    sections: list[ReportSectionRead] = Field(default_factory=list)


class ChecklistItemBase(BaseModel):
    code: str
    requirement: str
    status: str = "no_cumple"
    evidence: str = ""
    gap_description: str = ""
    recommendation: str = ""
    responsible_area: str = ""
    priority: str = "Media"


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemUpdate(BaseModel):
    code: str | None = None
    requirement: str | None = None
    status: str | None = None
    evidence: str | None = None
    gap_description: str | None = None
    recommendation: str | None = None
    responsible_area: str | None = None
    priority: str | None = None


class ChecklistItemRead(ChecklistItemBase, ReadMixin):
    organization_id: str


class ChecklistSeedResult(BaseModel):
    created: int
    existing: int


class ChecklistScore(BaseModel):
    total_items: int
    cumple: int
    parcial: int
    no_cumple: int
    no_aplica: int
    score_porcentaje: int


class ReportGenerateResult(BaseModel):
    report: FindingsReportRead
    metrics: dict[str, int | str]
