import type { CrudRecord } from "./crud";

export type DataMappingEntry = CrudRecord & {
  area: string;
  system_name: string;
  database_name: string;
  table_name: string;
  field_name: string;
  data_category: string;
  data_subject_universe: string;
  is_sensitive: boolean;
  is_part_of_database: boolean;
  database_category: string;
  treatment_purpose: string;
  legal_basis: string;
  data_source: string;
  international_transfer: boolean;
  third_party_communication: boolean;
  internal_responsible: string;
  retention_period: string;
  associated_platforms: string;
  access_roles: string;
  storage_location: string;
  automated_decisions: boolean;
  profiling: boolean;
  associated_risks: string;
  comments: string;
  area_manager_approval: boolean;
  area_manager_observations: string;
  validation_status: string;
};

export type DataMappingSummary = {
  total_registros: number;
  total_sistemas: number;
  total_datos_sensibles: number;
  total_transferencias_internacionales: number;
  total_perfilamiento: number;
  registros_pendientes: number;
  registros_validados: number;
};

export type ProcessingActivity = CrudRecord & {
  activity_name: string;
  responsible_or_processor: string;
  data_categories: string;
  data_subject_universe: string;
  treatment_purpose: string;
  legal_basis: string;
  legitimate_interest_detail: string;
  recipients: string;
  international_transfer: boolean;
  international_transfer_country: string;
  international_transfer_guarantees: string;
  retention_period: string;
  data_source: string;
  public_source: boolean;
  security_measures_reference: string;
  automated_decisions: boolean;
  profiling: boolean;
  profiling_logic: string;
  expected_consequences: string;
  source_mapping_entries: string;
  publication_status: string;
  risk_level: string;
  status: string;
};
