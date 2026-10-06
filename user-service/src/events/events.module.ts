import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { EventsPublisher } from "./events.publisher";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "USER_EVENTS_CLIENT",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672"],
          // RabbitMQ es el canal elegido para user.created: es el evento que arranca
          // el tutor_profile en Catalog, y perderlo dejaría a un tutor sin catálogo
          // (ver sección 6.2 de la regla de decisión del equipo).
          queue: "user_events_queue",
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  providers: [EventsPublisher],
  exports: [EventsPublisher],
})
export class EventsModule {}
