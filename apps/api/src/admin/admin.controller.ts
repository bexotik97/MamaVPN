import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Query,
  UnauthorizedException
} from "@nestjs/common";
import type { SubscriptionStatus } from "@prisma/client";
import { AdminService } from "./admin.service";

@Controller("admin")
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get("overview")
  async getOverview(@Headers("x-admin-api-key") apiKey?: string) {
    this.assertAdminApiKey(apiKey);
    return this.adminService.getOverview();
  }

  @Get("subscriptions")
  async listSubscriptions(
    @Headers("x-admin-api-key") apiKey?: string,
    @Query("status") status?: SubscriptionStatus,
    @Query("search") search?: string
  ) {
    this.assertAdminApiKey(apiKey);
    return this.adminService.listSubscriptions({
      status,
      search: search?.trim() || undefined
    });
  }

  @Post("subscriptions/:subscriptionId/extend")
  async extendSubscription(
    @Headers("x-admin-api-key") apiKey: string | undefined,
    @Param("subscriptionId") subscriptionId: string,
    @Body() body: { days?: number }
  ) {
    this.assertAdminApiKey(apiKey);
    return this.adminService.extendSubscription(subscriptionId, Number(body.days ?? 30));
  }

  @Post("subscriptions/:subscriptionId/suspend")
  async suspendSubscription(
    @Headers("x-admin-api-key") apiKey: string | undefined,
    @Param("subscriptionId") subscriptionId: string
  ) {
    this.assertAdminApiKey(apiKey);
    return this.adminService.suspendSubscription(subscriptionId);
  }

  @Post("subscriptions/:subscriptionId/resume")
  async resumeSubscription(
    @Headers("x-admin-api-key") apiKey: string | undefined,
    @Param("subscriptionId") subscriptionId: string
  ) {
    this.assertAdminApiKey(apiKey);
    return this.adminService.resumeSubscription(subscriptionId);
  }

  @Post("subscriptions/:subscriptionId/refresh")
  async refreshSubscription(
    @Headers("x-admin-api-key") apiKey: string | undefined,
    @Param("subscriptionId") subscriptionId: string
  ) {
    this.assertAdminApiKey(apiKey);
    return this.adminService.refreshSubscription(subscriptionId);
  }

  private assertAdminApiKey(apiKey?: string) {
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      throw new UnauthorizedException("Invalid admin api key");
    }
  }
}
