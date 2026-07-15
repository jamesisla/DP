import { createCrudService } from "./crud";
import type { ConsentRecord } from "../types/consent";

export const consentService = createCrudService<ConsentRecord>("/consents");
