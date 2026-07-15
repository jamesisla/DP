import { createCrudService } from "./crud";
import type { CommitteeSessionRecord } from "../types/committeeSession";

export const committeeSessionService = createCrudService<CommitteeSessionRecord>("/committee-sessions");
