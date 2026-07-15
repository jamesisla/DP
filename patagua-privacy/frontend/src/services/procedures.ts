import { createCrudService } from "./crud";
import type { ProcedureRecord } from "../types/procedure";

export const procedureService = createCrudService<ProcedureRecord>("/procedures");
