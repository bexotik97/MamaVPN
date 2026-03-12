export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace_period"
  | "expired"
  | "suspended";

export type PaymentStatus =
  | "pending"
  | "requires_action"
  | "paid"
  | "failed"
  | "refunded";

export type SupportTicketStatus =
  | "open"
  | "waiting_for_user"
  | "resolved"
  | "closed";

export type DevicePlatform =
  | "ios"
  | "android"
  | "macos"
  | "windows"
  | "linux"
  | "android_tv"
  | "router";

export interface PlanSummary {
  id: string;
  code: string;
  title: string;
  durationDays: number;
  priceRub: number;
  deviceLimit: number;
  isTrial: boolean;
  isPrivateTier: boolean;
}

export interface SubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  expiresAt: string | null;
  currentPlanCode: string;
  subscriptionUrl: string | null;
  activeLocationName: string | null;
}

export interface DashboardResponse {
  userId: string;
  telegramId: string;
  status: SubscriptionStatus;
  expiresAt: string | null;
  plans: PlanSummary[];
  subscription: SubscriptionSummary | null;
}
