import { createCrudService } from "./crud";
import type { FindingRecord } from "../types/finding";

export const findingService = createCrudService<FindingRecord>("/findings");
