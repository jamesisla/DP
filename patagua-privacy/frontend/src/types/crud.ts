export type CrudRecord = {
  id: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
  [key: string]: string | number | boolean | null;
};

export type FieldType = "text" | "email" | "textarea" | "select" | "date" | "datetime" | "number" | "toggle";

export type CrudField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  span?: "full" | "half";
};

export type CrudColumn = {
  key: string;
  label: string;
  type?: "text" | "status" | "risk" | "boolean" | "date";
};

export type CrudModuleConfig = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  columns: CrudColumn[];
  fields: CrudField[];
};
