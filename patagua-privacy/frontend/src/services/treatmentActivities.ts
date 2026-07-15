import { createCrudService } from "./crud";
import type { TreatmentActivityRecord } from "../types/treatmentActivity";

export const treatmentActivityService = createCrudService<TreatmentActivityRecord>("/treatment-activities");
