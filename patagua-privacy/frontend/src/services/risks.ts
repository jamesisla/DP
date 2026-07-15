import { createCrudService } from "./crud";
import type { RiskRecord } from "../types/risk";

export const riskService = createCrudService<RiskRecord>("/risks");
