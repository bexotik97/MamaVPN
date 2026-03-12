import { Controller, Inject, Param, Post } from "@nestjs/common";
import { ProvisioningService } from "./provisioning.service";

@Controller("provisioning")
export class ProvisioningController {
  constructor(@Inject(ProvisioningService) private readonly provisioningService: ProvisioningService) {}

  @Post(":subscriptionId/refresh")
  refresh(@Param("subscriptionId") subscriptionId: string) {
    return this.provisioningService.refreshAccess(subscriptionId);
  }

  @Post(":subscriptionId/suspend")
  suspend(@Param("subscriptionId") subscriptionId: string) {
    return this.provisioningService.suspend(subscriptionId);
  }
}
