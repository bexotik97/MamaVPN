import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { CreateSupportTicketInput } from "@mamavpn/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SupportService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createTicket(input: CreateSupportTicketInput) {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { telegramUserId: input.telegramUserId },
      include: { user: true }
    });

    if (!account) {
      throw new Error("Telegram account not found");
    }

    const latestSubscription = await this.prisma.subscription.findFirst({
      where: { userId: account.user.id },
      orderBy: { createdAt: "desc" }
    });

    return this.prisma.supportTicket.create({
      data: {
        userId: account.user.id,
        subscriptionId: latestSubscription?.id,
        topic: input.topic,
        diagnosticCode: input.diagnosticCode,
        details: (input.details ?? {}) as Prisma.InputJsonValue
      }
    });
  }

  async listOpenTickets() {
    return this.prisma.supportTicket.findMany({
      where: {
        status: {
          in: ["open", "waiting_for_user"]
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }
}
