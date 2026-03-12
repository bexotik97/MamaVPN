import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MarzbanService } from "./marzban.service";
import type { MarzbanProvisioningResult } from "@mamavpn/shared";

@Injectable()
export class MarzbanAdapter {
  private readonly logger = new Logger(MarzbanAdapter.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarzbanService) private readonly marzbanService: MarzbanService
  ) {}

  async provisionSubscription(input: {
    subscriptionId: string;
    userId: string;
    telegramUserId: string;
    expiresAt: Date;
    dataLimitBytes: bigint;
  }): Promise<MarzbanProvisioningResult> {
    const node = await this.getDefaultNode();
    const externalUsername = `tg_${input.telegramUserId}_${input.subscriptionId.slice(-6)}`;
    const { subscriptionUrl, fallbackSubscriptionUrl, statusRaw } =
      await this.createProvisioningResult({
        externalUsername,
        userId: input.userId,
        expiresAt: input.expiresAt,
        dataLimitBytes: input.dataLimitBytes,
        inboundTag: node.inboundTag
      });

    const marzbanUser = await this.prisma.marzbanUser.create({
      data: {
        nodeId: node.id,
        externalUsername,
        externalSubscriptionId: externalUsername,
        subscriptionUrl,
        statusRaw,
        expiresAt: input.expiresAt,
        dataLimitBytes: input.dataLimitBytes
      }
    });

    await this.prisma.subscription.update({
      where: { id: input.subscriptionId },
      data: {
        marzbanUserId: marzbanUser.id,
        activeLocationCode: node.locationCode,
        subscriptionUrl,
        fallbackSubscriptionUrl,
        lastSyncedAt: new Date()
      }
    });

    return {
      externalUsername,
      subscriptionUrl,
      fallbackSubscriptionUrl,
      nodeCode: node.code
    };
  }

  async suspendBySubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { marzbanUser: true }
    });

    if (!subscription?.marzbanUser) {
      return;
    }

    await this.marzbanService.suspendUser(subscription.marzbanUser.externalUsername);
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "suspended", lastSyncedAt: new Date() }
    });
  }

  async refreshAccess(subscriptionId: string) {
    return this.prisma.accessKey.create({
      data: {
        subscriptionId,
        type: "fallback",
        label: "Запасной ключ",
        value: `fallback://${subscriptionId}/${Date.now()}`
      }
    });
  }

  private async getDefaultNode() {
    const existing = await this.prisma.marzbanNode.findFirst({
      where: { isDefault: true }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.marzbanNode.create({
      data: {
        code: "de-main",
        title: "Germany Main",
        baseUrl: process.env.MARZBAN_BASE_URL ?? "https://marzban.example.com",
        locationCode: "de",
        countryCode: "DE",
        isDefault: true,
        inboundTag: process.env.MARZBAN_DEFAULT_INBOUND_TAG ?? "main"
      }
    });
  }

  private async createProvisioningResult(input: {
    externalUsername: string;
    userId: string;
    expiresAt: Date;
    dataLimitBytes: bigint;
    inboundTag: string;
  }) {
    const fallbackSubscriptionUrl = `${this.getSubscriptionPrefix()}/${input.externalUsername}?fallback=1`;

    if (this.shouldUseMockProvisioning()) {
      const subscriptionUrl = `${this.getSubscriptionPrefix()}/${input.externalUsername}`;
      this.logger.warn("Using mock Marzban provisioning for local development");

      return {
        subscriptionUrl,
        fallbackSubscriptionUrl,
        statusRaw: "mock-active"
      };
    }

    try {
      const expireUnix = Math.floor(input.expiresAt.getTime() / 1000);
      const result = await this.marzbanService.createUser({
        username: input.externalUsername,
        expire: expireUnix,
        dataLimit: Number(input.dataLimitBytes),
        note: `MamaVPN:${input.userId}`,
        inboundTag: input.inboundTag
      });

      return {
        subscriptionUrl:
          (result.subscription_url as string | undefined) ??
          `${this.getSubscriptionPrefix()}/${input.externalUsername}`,
        fallbackSubscriptionUrl,
        statusRaw: "active"
      };
    } catch (error) {
      const subscriptionUrl = `${this.getSubscriptionPrefix()}/${input.externalUsername}`;
      this.logger.warn(
        `Marzban provisioning failed, falling back to mock subscription: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      return {
        subscriptionUrl,
        fallbackSubscriptionUrl,
        statusRaw: "mock-fallback"
      };
    }
  }

  private shouldUseMockProvisioning() {
    const baseUrl = process.env.MARZBAN_BASE_URL ?? "";
    const password = process.env.MARZBAN_PASSWORD ?? "";
    const subscriptionPrefix = process.env.MARZBAN_SUBSCRIPTION_URL_PREFIX ?? "";

    return (
      !baseUrl ||
      !subscriptionPrefix ||
      baseUrl.includes("example.com") ||
      subscriptionPrefix.includes("example.com") ||
      password === "replace_me"
    );
  }

  private getSubscriptionPrefix() {
    return process.env.MARZBAN_SUBSCRIPTION_URL_PREFIX ?? "https://sub.mamavpn.local";
  }
}
