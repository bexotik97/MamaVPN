import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReferralsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getReferralProfile(telegramUserId: string) {
    const account = await this.prisma.telegramAccount.findUnique({
      where: { telegramUserId },
      include: { user: true }
    });

    if (!account) {
      throw new Error("Telegram account not found");
    }

    const referrals = await this.prisma.referral.findMany({
      where: { referrerUserId: account.user.id }
    });

    return {
      referralCode: account.user.referralCode,
      inviteLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${account.user.referralCode}`,
      totalReferrals: referrals.length,
      rewardRub: referrals.reduce(
        (sum: number, item: (typeof referrals)[number]) => sum + item.rewardRub,
        0
      ),
      rewardDays: referrals.reduce(
        (sum: number, item: (typeof referrals)[number]) => sum + item.rewardDays,
        0
      )
    };
  }
}
