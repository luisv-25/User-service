import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class EventsPublisher implements OnModuleInit {
  private readonly logger = new Logger(EventsPublisher.name);

  constructor(
    @Inject("USER_EVENTS_CLIENT") private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.client.connect();
  }

  publishUserCreated(payload: {
    userId: string;
    email: string;
    role: string;
    fullName?: string;
  }) {
    this.logger.log(`Publicando user.created para ${payload.userId}`);
    // emit() -> fire-and-forget, patrón evento de dominio (no request/response)
    return this.client.emit("user.created", {
      eventName: "user.created",
      occurredAt: new Date().toISOString(),
      data: payload,
    });
  }

  // Comunica el resultado del flujo de aprobación (documento primario,
  // sección 2 y 3) para que Catalog Service pueda, más adelante, filtrar u
  // ocultar del catálogo a los tutores que no estén "approved" —
  // precisamente "antes de su publicación en el catálogo".
  publishTutorVerificationUpdated(payload: { userId: string; status: string }) {
    this.logger.log(`Publicando tutor.verification.updated para ${payload.userId} (${payload.status})`);
    return this.client.emit("tutor.verification.updated", {
      eventName: "tutor.verification.updated",
      occurredAt: new Date().toISOString(),
      data: payload,
    });
  }

  publishUserDeleted(payload: { userId: string; role: string }) {
    this.logger.log(`Publicando user.deleted para ${payload.userId}`);
    // Catalog consume esto para eliminar el tutor_profile del tutor dado de
    // baja (permiso de admin: eliminar cuentas inactivas).
    return this.client.emit("user.deleted", {
      eventName: "user.deleted",
      occurredAt: new Date().toISOString(),
      data: payload,
    });
  }
}
