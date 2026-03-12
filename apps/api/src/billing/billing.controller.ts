import { Body, Controller, Inject, Param, Post } from "@nestjs/common";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Post("invoice")
  createInvoice(
    @Body()
    body: {
      userId: string;
      subscriptionId?: string;
      amountRub: number;
      promoCode?: string;
    }
  ) {
    return this.billingService.createInvoice(body);
  }

  @Post("pay/:paymentId")
  markPaid(@Param("paymentId") paymentId: string) {
    return this.billingService.markPaid(paymentId);
  }
}
