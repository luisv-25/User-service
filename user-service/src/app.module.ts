import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { User } from "./users/entities/user.entity";
import { AvailabilitySlot } from "./users/entities/availability-slot.entity";
import { RefreshToken } from "./users/entities/refresh-token.entity";
import { TutorCredential } from "./users/entities/tutor-credential.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5433,
      username: process.env.DB_USER || "user_svc",
      password: process.env.DB_PASSWORD || "user_svc_pw",
      database: process.env.DB_NAME || "user_db",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      entities: [User, AvailabilitySlot, RefreshToken, TutorCredential],
      synchronize: process.env.DB_SYNCHRONIZE !== "false", // OK para el entorno local de esta entrega; en un pipeline real irían migraciones versionadas
    }),
    EventsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
