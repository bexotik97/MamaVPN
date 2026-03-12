import { Inject, Injectable } from "@nestjs/common";
import { MarzbanAdapter } from "../marzban/marzban.adapter";

@Injectable()
export class ProvisioningService {
  constructor(@Inject(MarzbanAdapter) private readonly marzbanAdapter: MarzbanAdapter) {}

  async refreshAccess(subscriptionId: string) {
    return this.marzbanAdapter.refreshAccess(subscriptionId);
  }

  async suspend(subscriptionId: string) {
    return this.marzbanAdapter.suspendBySubscription(subscriptionId);
  }

  async resume(subscriptionId: string) {
    return this.marzbanAdapter.resumeBySubscription(subscriptionId);
  }

  async syncSubscription(subscriptionId: string) {
    return this.marzbanAdapter.syncSubscription(subscriptionId);
  }
}
