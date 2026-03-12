import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
