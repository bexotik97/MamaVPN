import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(@Inject(SubscriptionsService) private readonly subscriptionsService: SubscriptionsService) {}

  @Post("bootstrap")
  bootstrapUser(
    @Body()
    body: {
      telegramUserId: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      languageCode?: string;
    }
  ) {
    return this.subscriptionsService.bootstrapUser(body);
  }

  @Post("trial")
  startTrial(
    @Body()
    body: {
      telegramUserId: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      languageCode?: string;
      platform: "ios" | "android" | "macos" | "windows" | "linux" | "android_tv" | "router";
    }
  ) {
    return this.subscriptionsService.startTrial(body);
  }

  @Post("purchase")
  purchasePlan(
    @Body()
    body: {
      telegramUserId: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      languageCode?: string;
      planCode: string;
      promoCode?: string;
    }
  ) {
    return this.subscriptionsService.purchasePlan(body);
  }

  @Post("activate-payment/:paymentId")
  activatePayment(@Param("paymentId") paymentId: string) {
    return this.subscriptionsService.activatePayment(paymentId);
  }

  @Get("telegram/:telegramUserId/active")
  getActive(@Param("telegramUserId") telegramUserId: string) {
    return this.subscriptionsService.getActiveByTelegramId(telegramUserId);
  }
}
