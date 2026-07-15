import { createCrudService } from "./crud";
import type { CommitteeMemberRecord } from "../types/committeeMember";

export const committeeMemberService = createCrudService<CommitteeMemberRecord>("/committee-members");
