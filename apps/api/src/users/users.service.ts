import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PlansService } from "../plans/plans.service";

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PlansService) private readonly plansService: PlansService
  ) {}

  async getDashboardByTelegramId(telegramUserId: string) {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { telegramUserId },
      include: {
        user: {
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    if (!account) {
      throw new NotFoundException("Telegram account not found");
    }

    const plans = await this.plansService.list();
    const current = account.user.subscriptions[0] ?? null;

    return {
      userId: account.user.id,
      telegramId: account.telegramUserId,
      status: current?.status ?? "expired",
      expiresAt: current?.expiresAt?.toISOString() ?? null,
      plans: plans.map((plan: (typeof plans)[number]) => ({
        id: plan.id,
        code: plan.code,
        title: plan.title,
        durationDays: plan.durationDays,
        priceRub: plan.priceRub,
        deviceLimit: plan.deviceLimit,
        isTrial: plan.isTrial,
        isPrivateTier: plan.isPrivateTier
      })),
      subscription: current
        ? {
            id: current.id,
            status: current.status,
            expiresAt: current.expiresAt?.toISOString() ?? null,
            currentPlanCode: current.plan.code,
            subscriptionUrl: current.subscriptionUrl,
            activeLocationName: current.activeLocationCode
          }
        : null
    };
  }
}
