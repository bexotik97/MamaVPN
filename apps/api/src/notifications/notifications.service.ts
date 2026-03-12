import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async enqueueLifecycleBroadcasts() {
    const now = new Date();
    const next48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: {
          in: ["trial", "active", "grace_period"]
        },
        expiresAt: {
          not: null,
          lte: next48,
          gte: now
        }
      }
    });

    for (const subscription of subscriptions) {
      const audienceTag = `subscription:${subscription.id}`;
      const expiry = subscription.expiresAt;

      if (!expiry) {
        continue;
      }

      const is24h = expiry <= next24;
      const title = is24h ? "До конца подписки 24 часа" : "До конца подписки 48 часов";

      await this.prisma.broadcast.create({
        data: {
          type: "reminder",
          title,
          message: is24h
            ? "Подписка скоро закончится. Продлите доступ в боте."
            : "Подписка заканчивается через 48 часов. Проверьте статус и продление.",
          audienceTag
        }
      });
    }
  }
}
