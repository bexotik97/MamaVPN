import { Controller, Get, Inject, Param } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";

@Controller("referrals")
export class ReferralsController {
  constructor(@Inject(ReferralsService) private readonly referralsService: ReferralsService) {}

  @Get("telegram/:telegramUserId")
  getReferralProfile(@Param("telegramUserId") telegramUserId: string) {
    return this.referralsService.getReferralProfile(telegramUserId);
  }
}
