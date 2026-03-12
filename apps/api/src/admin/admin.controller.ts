import { Controller, Get, Headers, Inject, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("admin")
export class AdminController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get("overview")
  async getOverview(@Headers("x-admin-api-key") apiKey?: string) {
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException("Invalid admin api key");
    }

    const [users, subscriptions, payments, tickets] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count(),
      this.prisma.payment.count(),
      this.prisma.supportTicket.count({
        where: { status: { in: ["open", "waiting_for_user"] } }
      })
    ]);

    return {
      users,
      subscriptions,
      payments,
      openSupportTickets: tickets
    };
  }
}
