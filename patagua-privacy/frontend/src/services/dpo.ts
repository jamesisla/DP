import { createCrudService } from "./crud";
import type { DpoRecord } from "../types/dpo";

export const dpoService = createCrudService<DpoRecord>("/dpos");
