import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { EventsModule } from "../events/events.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    UsersModule,
    EventsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret_change_me",
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
