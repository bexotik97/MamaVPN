import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { MarzbanModule } from "../marzban/marzban.module";
import { PlansModule } from "../plans/plans.module";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";

@Module({
  imports: [AuthModule, PlansModule, BillingModule, MarzbanModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService]
})
export class SubscriptionsModule {}
