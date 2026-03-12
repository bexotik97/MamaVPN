import { Controller, Get, Inject, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get("telegram/:telegramUserId/dashboard")
  getDashboard(@Param("telegramUserId") telegramUserId: string) {
    return this.usersService.getDashboardByTelegramId(telegramUserId);
  }
}
