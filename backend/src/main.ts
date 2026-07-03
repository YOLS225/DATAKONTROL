import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module.js";
import { DomainExceptionFilter } from "./presentation/filters/domain-exception.filter.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableCors();
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
