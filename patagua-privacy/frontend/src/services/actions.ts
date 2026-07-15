import { createCrudService } from "./crud";
import type { ActionRecord } from "../types/action";

export const actionService = createCrudService<ActionRecord>("/actions");
