import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { SupportService } from "./support.service";

@Controller("support")
export class SupportController {
  constructor(@Inject(SupportService) private readonly supportService: SupportService) {}

  @Post("tickets")
  createTicket(
    @Body()
    body: {
      telegramUserId: string;
      diagnosticCode: string;
      topic: string;
      details?: Record<string, unknown>;
    }
  ) {
    return this.supportService.createTicket(body);
  }

  @Get("tickets/open")
  listOpenTickets() {
    return this.supportService.listOpenTickets();
  }
}
