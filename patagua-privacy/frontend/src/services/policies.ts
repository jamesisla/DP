import { createCrudService } from "./crud";
import type { PolicyRecord } from "../types/policy";

export const policyService = createCrudService<PolicyRecord>("/policies");
