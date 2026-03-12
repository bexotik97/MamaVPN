import { Controller, Get, Inject } from "@nestjs/common";
import { PlansService } from "./plans.service";

@Controller("plans")
export class PlansController {
  constructor(@Inject(PlansService) private readonly plansService: PlansService) {}

  @Get()
  async list() {
    const plans = await this.plansService.list();

    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      title: plan.title,
      description: plan.description,
      durationDays: plan.durationDays,
      priceRub: plan.priceRub,
      deviceLimit: plan.deviceLimit,
      isTrial: plan.isTrial,
      isPrivateTier: plan.isPrivateTier
    }));
  }
}
