import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { BillingService } from "../billing/billing.service";
import { MarzbanAdapter } from "../marzban/marzban.adapter";
import { PlansService } from "../plans/plans.service";
import { PrismaService } from "../prisma/prisma.service";
import type { PurchasePlanInput, StartTrialInput, TelegramIdentityInput } from "@mamavpn/shared";

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(PlansService) private readonly plansService: PlansService,
    @Inject(BillingService) private readonly billingService: BillingService,
    @Inject(MarzbanAdapter) private readonly marzbanAdapter: MarzbanAdapter
  ) {}

  async bootstrapUser(input: TelegramIdentityInput) {
    return this.authService.ensureTelegramUser(input);
  }

  async startTrial(input: StartTrialInput & TelegramIdentityInput) {
    const account = await this.authService.ensureTelegramUser(input);
    const trialPlan = await this.plansService.getByCode("trial");

    if (!trialPlan) {
      throw new NotFoundException("Trial plan not found");
    }

    const expiresAt = this.addDays(new Date(), trialPlan.durationDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId: account.user.id,
        planId: trialPlan.id,
        status: "trial",
        source: "bot",
        expiresAt
      }
    });

    await this.prisma.device.create({
      data: {
        userId: account.user.id,
        subscriptionId: subscription.id,
        platform: input.platform,
        displayName: input.platform
      }
    });

    const provisioning = await this.marzbanAdapter.provisionSubscription({
      subscriptionId: subscription.id,
      userId: account.user.id,
      telegramUserId: input.telegramUserId,
      expiresAt,
      dataLimitBytes: BigInt(
        trialPlan.dataLimitBytes?.toString() ??
          process.env.MARZBAN_DEFAULT_DATA_LIMIT_BYTES ??
          "536870912"
      )
    });

    return {
      subscriptionId: subscription.id,
      status: "trial",
      expiresAt,
      subscriptionUrl: provisioning.subscriptionUrl,
      fallbackSubscriptionUrl: provisioning.fallbackSubscriptionUrl
    };
  }

  async purchasePlan(input: PurchasePlanInput & TelegramIdentityInput) {
    const account = await this.authService.ensureTelegramUser(input);
    const plan = await this.plansService.getByCode(input.planCode);

    if (!plan) {
      throw new NotFoundException("Plan not found");
    }

    const startsAt = new Date();
    const expiresAt = this.addDays(startsAt, plan.durationDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId: account.user.id,
        planId: plan.id,
        status: "grace_period",
        source: "miniapp",
        startsAt,
        expiresAt,
        gracePeriodEndsAt: this.addDays(startsAt, 2)
      }
    });

    const invoice = await this.billingService.createInvoice({
      userId: account.user.id,
      subscriptionId: subscription.id,
      amountRub: plan.priceRub,
      promoCode: input.promoCode
    });

    return {
      subscriptionId: subscription.id,
      invoice
    };
  }

  async activatePayment(paymentId: string) {
    const payment = await this.billingService.markPaid(paymentId);

    if (!payment.subscriptionId) {
      return payment;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: payment.subscriptionId },
      include: {
        user: {
          include: {
            telegramAccounts: true
          }
        },
        plan: true
      }
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    const active = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "active"
      }
    });

    const telegramUserId = subscription.user.telegramAccounts[0]?.telegramUserId ?? subscription.user.id;

    if (!active.marzbanUserId) {
      await this.marzbanAdapter.provisionSubscription({
        subscriptionId: active.id,
        userId: subscription.user.id,
        telegramUserId,
        expiresAt: active.expiresAt ?? this.addDays(new Date(), subscription.plan.durationDays),
        dataLimitBytes: BigInt(
          subscription.plan.dataLimitBytes?.toString() ??
            Number.MAX_SAFE_INTEGER.toString()
        )
      });
    }

    return this.prisma.subscription.findUnique({
      where: { id: active.id }
    });
  }

  async getActiveByTelegramId(telegramUserId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        user: {
          telegramAccounts: {
            some: {
              telegramUserId
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
