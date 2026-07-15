import { createCrudService } from "./crud";
import type { TicketRecord } from "../types/ticket";

export const ticketService = createCrudService<TicketRecord>("/tickets");
