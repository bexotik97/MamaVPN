-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('ios', 'android', 'macos', 'windows', 'linux', 'android_tv', 'router');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'grace_period', 'expired', 'suspended');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'requires_action', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('mock', 'telegram_stars', 'crypto', 'yookassa');

-- CreateEnum
CREATE TYPE "AccessKeyType" AS ENUM ('primary', 'fallback', 'backup');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'waiting_for_user', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "BroadcastType" AS ENUM ('incident', 'reminder', 'promo', 'retention', 'maintenance');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('system', 'admin', 'user', 'bot');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'ru',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "referralCode" TEXT NOT NULL,
    "referredByUserId" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "isBotBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastBotStartAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "platform" "DevicePlatform" NOT NULL,
    "displayName" TEXT NOT NULL,
    "externalDeviceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "priceRub" INTEGER NOT NULL,
    "deviceLimit" INTEGER NOT NULL DEFAULT 1,
    "dataLimitBytes" BIGINT,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrivateTier" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'bot',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "gracePeriodEndsAt" TIMESTAMP(3),
    "marzbanUserId" TEXT,
    "activeLocationCode" TEXT,
    "subscriptionUrl" TEXT,
    "fallbackSubscriptionUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "provider" "BillingProvider" NOT NULL,
    "externalPaymentId" TEXT,
    "invoiceId" TEXT,
    "amountRub" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" "PaymentStatus" NOT NULL,
    "promoCodeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarzbanNode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "inboundTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarzbanNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarzbanUser" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "externalUsername" TEXT NOT NULL,
    "externalSubscriptionId" TEXT,
    "subscriptionUrl" TEXT,
    "statusRaw" TEXT,
    "expiresAt" TIMESTAMP(3),
    "dataLimitBytes" BIGINT,
    "usedTrafficBytes" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarzbanUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessKey" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "marzbanUserId" TEXT,
    "type" "AccessKeyType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "topic" TEXT NOT NULL,
    "diagnosticCode" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "details" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "rewardRub" INTEGER NOT NULL DEFAULT 0,
    "rewardDays" INTEGER NOT NULL DEFAULT 0,
    "rewardGrantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discountRub" INTEGER,
    "discountPercent" INTEGER,
    "planId" TEXT,
    "maxRedemptions" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "type" "BroadcastType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audienceTag" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT,
    "userId" TEXT,
    "eventName" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramAccount_telegramUserId_key" ON "TelegramAccount"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MarzbanNode_code_key" ON "MarzbanNode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MarzbanUser_externalUsername_key" ON "MarzbanUser"("externalUsername");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramAccount" ADD CONSTRAINT "TelegramAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_marzbanUserId_fkey" FOREIGN KEY ("marzbanUserId") REFERENCES "MarzbanUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarzbanUser" ADD CONSTRAINT "MarzbanUser_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "MarzbanNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessKey" ADD CONSTRAINT "AccessKey_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessKey" ADD CONSTRAINT "AccessKey_marzbanUserId_fkey" FOREIGN KEY ("marzbanUserId") REFERENCES "MarzbanUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

