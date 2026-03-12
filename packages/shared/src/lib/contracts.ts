import type { DashboardResponse, DevicePlatform } from "./domain";

export interface TelegramIdentityInput {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export interface StartTrialInput {
  telegramUserId: string;
  platform: DevicePlatform;
}

export interface PurchasePlanInput {
  telegramUserId: string;
  planCode: string;
  promoCode?: string;
}

export interface CreateSupportTicketInput {
  telegramUserId: string;
  diagnosticCode: string;
  topic: string;
  details?: Record<string, unknown>;
}

export interface BillingInvoice {
  paymentId: string;
  provider: string;
  status: string;
  amountRub: number;
  payUrl?: string;
}

export interface MarzbanProvisioningResult {
  externalUsername: string;
  subscriptionUrl: string;
  fallbackSubscriptionUrl?: string;
  nodeCode: string;
}

export interface MiniAppBootstrapPayload {
  dashboard: DashboardResponse;
  supportUrl: string;
  channelUrl: string;
}
