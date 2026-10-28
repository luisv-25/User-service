import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  // CAMBIO: permite recibir PDFs de credenciales (llegan dentro del JSON). Por defecto el
  // límite es 100 kb y casi ningún PDF cabe. 10 MB cubre el máximo de 5 MB de la pantalla.
  app.useBodyParser("json", { limit: "10mb" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[user-service] listening on port ${port}`);
}
bootstrap();
