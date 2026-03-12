import { Module } from "@nestjs/common";
import { MarzbanAdapter } from "./marzban.adapter";
import { MarzbanService } from "./marzban.service";

@Module({
  providers: [MarzbanService, MarzbanAdapter],
  exports: [MarzbanService, MarzbanAdapter]
})
export class MarzbanModule {}
