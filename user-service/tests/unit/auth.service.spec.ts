import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "../../src/auth/auth.service";

// Pruebas UNITARIAS de AuthService: las dependencias externas (base de datos vía UsersService,
// JWT y RabbitMQ vía EventsPublisher) se reemplazan por mocks.
describe("AuthService (unitaria, con mocks)", () => {
  const usersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    toPublicProfile: jest.fn((u) => ({ id: u.id, email: u.email, role: u.role })),
  };
  const jwtService = { sign: jest.fn().mockReturnValue("token-falso") };
  const eventsPublisher = { publishUserCreated: jest.fn() };
  const service = new AuthService(usersService as any, jwtService as any, eventsPublisher as any);

  beforeEach(() => jest.clearAllMocks());

  it("Unitaria 1: registrar con un correo ya existente lanza ConflictException y no publica eventos", async () => {
    usersService.findByEmail.mockResolvedValue({ id: "u1", email: "ana@correo.com" });

    await expect(
      service.register({ email: "ana@correo.com", password: "12345678", role: "student" } as any),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersService.createUser).not.toHaveBeenCalled();
    expect(eventsPublisher.publishUserCreated).not.toHaveBeenCalled();
  });

  it("Unitaria 2: iniciar sesión con contraseña incorrecta lanza UnauthorizedException; con la correcta entrega tokens", async () => {
    const hash = await bcrypt.hash("clave-correcta", 4);
    usersService.findByEmail.mockResolvedValue({ id: "u2", email: "luis@correo.com", role: "tutor", password_hash: hash });

    await expect(service.login({ email: "luis@correo.com", password: "clave-incorrecta" } as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    const ok = await service.login({ email: "luis@correo.com", password: "clave-correcta" } as any);
    expect(ok.accessToken).toBe("token-falso");
    expect(ok.refreshToken).toBe("token-falso");
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: "u2", role: "tutor" }, { expiresIn: "15m" });
  });
});
