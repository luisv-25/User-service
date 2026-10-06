import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { EventsPublisher } from "../events/events.publisher";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventsPublisher: EventsPublisher,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException("El correo ya está registrado");
    }

    const password_hash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.createUser({
      email: dto.email,
      password_hash,
      role: dto.role,
      full_name: dto.fullName,
    });

    // Comunicación ASÍNCRONA: cualquier otro servicio interesado
    // (Catalog crea el tutor_profile base) reacciona a este evento sin
    // que User Service tenga que conocer a sus consumidores.
    this.eventsPublisher.publishUserCreated({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    return this.usersService.toPublicProfile(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Credenciales inválidas");

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException("Credenciales inválidas");

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: "15m" },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: "7d" },
    );

    return {
      accessToken,
      refreshToken,
      user: this.usersService.toPublicProfile(user),
    };
  }
}
