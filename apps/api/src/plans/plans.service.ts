import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const defaultPlans = [
  {
    code: "trial",
    title: "Пробный",
    description: "Быстрый тест сервиса на 3 дня",
    durationDays: 3,
    priceRub: 0,
    deviceLimit: 1,
    dataLimitBytes: BigInt(536870912),
    isTrial: true,
    isPrivateTier: false
  },
  {
    code: "daily",
    title: "1 день",
    description: "Низкий порог входа",
    durationDays: 1,
    priceRub: 49,
    deviceLimit: 1,
    isTrial: false,
    isPrivateTier: false
  },
  {
    code: "monthly",
    title: "1 месяц",
    description: "Основной план",
    durationDays: 30,
    priceRub: 399,
    deviceLimit: 3,
    isTrial: false,
    isPrivateTier: false
  },
  {
    code: "yearly",
    title: "1 год",
    description: "Максимальная выгода",
    durationDays: 365,
    priceRub: 2990,
    deviceLimit: 5,
    isTrial: false,
    isPrivateTier: false
  },
  {
    code: "private_server",
    title: "Private Server",
    description: "Премиум-уровень для power users",
    durationDays: 30,
    priceRub: 1990,
    deviceLimit: 10,
    isTrial: false,
    isPrivateTier: true
  }
];

@Injectable()
export class PlansService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async ensureDefaults() {
    await Promise.all(
      defaultPlans.map((plan) =>
        this.prisma.plan.upsert({
          where: { code: plan.code },
          update: plan,
          create: plan
        })
      )
    );
  }

  async list() {
    await this.ensureDefaults();
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ isTrial: "desc" }, { priceRub: "asc" }]
    });
  }

  async getByCode(code: string) {
    await this.ensureDefaults();
    return this.prisma.plan.findUnique({ where: { code } });
  }
}
