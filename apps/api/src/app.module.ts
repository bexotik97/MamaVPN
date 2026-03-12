import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { MarzbanModule } from "./marzban/marzban.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PlansModule } from "./plans/plans.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProvisioningModule } from "./provisioning/provisioning.module";
import { ReferralsModule } from "./referrals/referrals.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { SupportModule } from "./support/support.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PlansModule,
    UsersModule,
    MarzbanModule,
    BillingModule,
    SubscriptionsModule,
    ProvisioningModule,
    SupportModule,
    ReferralsModule,
    NotificationsModule,
    AdminModule
  ],
  controllers: [AppController]
})
export class AppModule {}
