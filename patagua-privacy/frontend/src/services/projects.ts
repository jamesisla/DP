import { createCrudService } from "./crud";
import type { ProjectRecord } from "../types/project";

export const projectService = createCrudService<ProjectRecord>("/projects");
