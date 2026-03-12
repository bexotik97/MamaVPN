import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ProvisioningService } from "../provisioning/provisioning.service";

type SubscriptionFilters = {
  status?: SubscriptionStatus;
  search?: string;
};

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProvisioningService) private readonly provisioningService: ProvisioningService
  ) {}

  async getOverview() {
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

  async listSubscriptions(filters: SubscriptionFilters) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search
          ? {
              OR: [
                {
                  id: {
                    contains: filters.search
                  }
                },
                {
                  plan: {
                    code: {
                      contains: filters.search,
                      mode: "insensitive"
                    }
                  }
                },
                {
                  user: {
                    referralCode: {
                      contains: filters.search,
                      mode: "insensitive"
                    }
                  }
                },
                {
                  user: {
                    telegramAccounts: {
                      some: {
                        telegramUserId: {
                          contains: filters.search
                        }
                      }
                    }
                  }
                },
                {
                  user: {
                    telegramAccounts: {
                      some: {
                        username: {
                          contains: filters.search,
                          mode: "insensitive"
                        }
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        plan: true,
        user: {
          include: {
            telegramAccounts: {
              orderBy: { createdAt: "asc" }
            }
          }
        },
        accessKeys: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
      take: 200
    });

    return subscriptions.map((subscription) => this.mapSubscription(subscription));
  }

  async extendSubscription(subscriptionId: string, days: number) {
    if (!Number.isFinite(days) || days < 1) {
      throw new BadRequestException("Days must be a positive number");
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    const now = new Date();
    const baseDate =
      subscription.expiresAt && subscription.expiresAt > now ? subscription.expiresAt : now;
    const expiresAt = this.addDays(baseDate, days);

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        expiresAt,
        gracePeriodEndsAt: null,
        status: subscription.status === "suspended" ? "suspended" : "active"
      }
    });

    await this.provisioningService.syncSubscription(subscriptionId);
    return this.getSubscription(subscriptionId);
  }

  async suspendSubscription(subscriptionId: string) {
    await this.ensureSubscription(subscriptionId);
    await this.provisioningService.suspend(subscriptionId);
    return this.getSubscription(subscriptionId);
  }

  async resumeSubscription(subscriptionId: string) {
    await this.ensureSubscription(subscriptionId);
    await this.provisioningService.resume(subscriptionId);
    return this.getSubscription(subscriptionId);
  }

  async refreshSubscription(subscriptionId: string) {
    await this.ensureSubscription(subscriptionId);
    const accessKey = await this.provisioningService.refreshAccess(subscriptionId);

    return {
      subscription: await this.getSubscription(subscriptionId),
      accessKey: {
        id: accessKey.id,
        label: accessKey.label,
        value: accessKey.value,
        createdAt: accessKey.createdAt.toISOString()
      }
    };
  }

  async getSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        user: {
          include: {
            telegramAccounts: {
              orderBy: { createdAt: "asc" }
            }
          }
        },
        accessKeys: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    return this.mapSubscription(subscription);
  }

  private async ensureSubscription(subscriptionId: string) {
    const exists = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: { id: true }
    });

    if (!exists) {
      throw new NotFoundException("Subscription not found");
    }
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private mapSubscription(
    subscription: {
      id: string;
      status: SubscriptionStatus;
      source: string;
      startsAt: Date;
      expiresAt: Date | null;
      gracePeriodEndsAt: Date | null;
      activeLocationCode: string | null;
      subscriptionUrl: string | null;
      fallbackSubscriptionUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
      plan: {
        code: string;
        title: string;
        priceRub: number;
      };
      user: {
        id: string;
        referralCode: string;
        telegramAccounts: Array<{
          telegramUserId: string;
          username: string | null;
          firstName: string | null;
          lastName: string | null;
        }>;
      };
      accessKeys: Array<{
        id: string;
        label: string;
        value: string;
        createdAt: Date;
      }>;
    }
  ) {
    const telegramAccount = subscription.user.telegramAccounts[0] ?? null;
    const remainingMs = subscription.expiresAt
      ? subscription.expiresAt.getTime() - Date.now()
      : null;
    const remainingDays =
      remainingMs !== null ? Math.ceil(remainingMs / (24 * 60 * 60 * 1000)) : null;
    const remainingHours = remainingMs !== null ? Math.ceil(remainingMs / (60 * 60 * 1000)) : null;

    return {
      id: subscription.id,
      status: subscription.status,
      source: subscription.source,
      startsAt: subscription.startsAt.toISOString(),
      expiresAt: subscription.expiresAt?.toISOString() ?? null,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt?.toISOString() ?? null,
      remainingDays,
      remainingHours,
      activeLocationCode: subscription.activeLocationCode,
      subscriptionUrl: subscription.subscriptionUrl,
      fallbackSubscriptionUrl: subscription.fallbackSubscriptionUrl,
      plan: {
        code: subscription.plan.code,
        title: subscription.plan.title,
        priceRub: subscription.plan.priceRub
      },
      user: {
        id: subscription.user.id,
        referralCode: subscription.user.referralCode,
        telegramUserId: telegramAccount?.telegramUserId ?? null,
        username: telegramAccount?.username ?? null,
        displayName:
          [telegramAccount?.firstName, telegramAccount?.lastName].filter(Boolean).join(" ") || null
      },
      latestAccessKey: subscription.accessKeys[0]
        ? {
            id: subscription.accessKeys[0].id,
            label: subscription.accessKeys[0].label,
            value: subscription.accessKeys[0].value,
            createdAt: subscription.accessKeys[0].createdAt.toISOString()
          }
        : null,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString()
    };
  }
}
