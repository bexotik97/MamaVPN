import { Module } from "@nestjs/common";
import { MarzbanModule } from "../marzban/marzban.module";
import { ProvisioningController } from "./provisioning.controller";
import { ProvisioningService } from "./provisioning.service";

@Module({
  imports: [MarzbanModule],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
  exports: [ProvisioningService]
})
export class ProvisioningModule {}
