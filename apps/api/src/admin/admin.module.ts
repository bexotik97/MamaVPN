import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { ProvisioningModule } from "../provisioning/provisioning.module";

@Module({
  imports: [ProvisioningModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
