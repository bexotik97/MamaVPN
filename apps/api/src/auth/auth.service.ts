import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { TelegramIdentityInput } from "@mamavpn/shared";

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async ensureTelegramUser(input: TelegramIdentityInput) {
    const existingAccount = await this.prisma.telegramAccount.findUnique({
      where: { telegramUserId: input.telegramUserId },
      include: { user: true }
    });

    if (existingAccount) {
      return this.prisma.telegramAccount.update({
        where: { telegramUserId: input.telegramUserId },
        data: {
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          lastBotStartAt: new Date(),
          user: {
            update: {
              languageCode: input.languageCode ?? existingAccount.user.languageCode,
              lastSeenAt: new Date()
            }
          }
        },
        include: { user: true }
      });
    }

    return this.prisma.telegramAccount.create({
      data: {
        telegramUserId: input.telegramUserId,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        lastBotStartAt: new Date(),
        user: {
          create: {
            languageCode: input.languageCode ?? "ru",
            referralCode: `ref_${input.telegramUserId}`
          }
        }
      },
      include: { user: true }
    });
  }
}
