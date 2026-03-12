import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BillingService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createInvoice(input: {
    userId: string;
    subscriptionId?: string;
    amountRub: number;
    promoCode?: string;
  }) {
    const promo = input.promoCode
      ? await this.prisma.promoCode.findUnique({ where: { code: input.promoCode } })
      : null;

    const finalAmount = promo?.discountRub
      ? Math.max(0, input.amountRub - promo.discountRub)
      : promo?.discountPercent
        ? Math.max(0, Math.floor(input.amountRub * (100 - promo.discountPercent) / 100))
        : input.amountRub;

    const payment = await this.prisma.payment.create({
      data: {
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        provider: "mock",
        amountRub: finalAmount,
        status: "pending",
        invoiceId: `inv_${Date.now()}`,
        promoCodeId: promo?.id
      }
    });

    return {
      paymentId: payment.id,
      provider: payment.provider,
      status: payment.status,
      amountRub: payment.amountRub,
      payUrl: `/billing/pay/${payment.id}`
    };
  }

  async markPaid(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        paidAt: new Date()
      }
    });
  }
}
