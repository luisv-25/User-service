import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TutorCredential, CredentialStatus } from "./entities/tutor-credential.entity";
import { User, TutorVerificationStatus, UserRole } from "./entities/user.entity";
import { CreateCredentialDto } from "./dto/create-credential.dto";
import { EventsPublisher } from "../events/events.publisher";

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(TutorCredential)
    private readonly credentialsRepo: Repository<TutorCredential>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly eventsPublisher: EventsPublisher,
  ) {}

  private async getTutor(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);
    if (user.role !== UserRole.TUTOR) {
      throw new NotFoundException(`${userId} no tiene rol de tutor; no aplica flujo de credenciales`);
    }
    return user;
  }

  async create(userId: string, dto: CreateCredentialDto) {
    const user = await this.getTutor(userId);
    const credential = await this.credentialsRepo.save(
      this.credentialsRepo.create({
        user,
        document_type: dto.documentType,
        document_url: dto.documentUrl,
        status: CredentialStatus.PENDING,
      }),
    );
    await this.recomputeVerificationStatus(userId);
    return credential;
  }

  async findForTutor(userId: string) {
    await this.getTutor(userId);
    return this.credentialsRepo.find({
      where: { user: { id: userId } },
      order: { created_at: "DESC" },
    });
  }

  // Cola de revisión para el admin: todas las credenciales pendientes,
  // de cualquier tutor, con el nombre del tutor para no tener que cruzar
  // manualmente contra /users.
  async findPending() {
  const list = await this.credentialsRepo.find({
    where: { status: CredentialStatus.PENDING },
    relations: ["user"],
    order: { created_at: "ASC" },
  });
  return list.map((c) => ({
    ...c,
    user: c.user ? { id: c.user.id, email: c.user.email, full_name: c.user.full_name } : undefined,
  }));
}

  // Acción de admin: aprobar o rechazar una credencial puntual. Después
  // recalcula el estado agregado del tutor (users.tutor_verification_status)
  // y publica el evento para quien esté escuchando (Catalog, a futuro).
  async verify(credentialId: string, status: "approved" | "rejected", adminId: string) {
    const credential = await this.credentialsRepo.findOne({
      where: { id: credentialId },
      relations: ["user"],
    });
    if (!credential) throw new NotFoundException(`Credencial ${credentialId} no encontrada`);

    credential.status = status === "approved" ? CredentialStatus.APPROVED : CredentialStatus.REJECTED;
    credential.verified_at = new Date();
    credential.verified_by = adminId;
    await this.credentialsRepo.save(credential);

    await this.recomputeVerificationStatus(credential.user.id);
    return credential;
  }

  // Regla: con al menos una credencial aprobada, el tutor queda APPROVED.
  // Si no hay ninguna aprobada pero sí alguna pendiente, queda PENDING.
  // Si todas las que tiene están rechazadas (y ninguna pendiente/aprobada),
  // queda REJECTED. Se recalcula desde cero cada vez, no se incrementa,
  // para que quede siempre consistente sin importar el orden de revisión.
  private async recomputeVerificationStatus(userId: string) {
    const all = await this.credentialsRepo.find({ where: { user: { id: userId } } });

    let next: TutorVerificationStatus;
    if (all.some((c) => c.status === CredentialStatus.APPROVED)) {
      next = TutorVerificationStatus.APPROVED;
    } else if (all.some((c) => c.status === CredentialStatus.PENDING)) {
      next = TutorVerificationStatus.PENDING;
    } else if (all.length > 0) {
      next = TutorVerificationStatus.REJECTED;
    } else {
      next = TutorVerificationStatus.NOT_SUBMITTED;
    }

    await this.usersRepo.update({ id: userId }, { tutor_verification_status: next });
    this.eventsPublisher.publishTutorVerificationUpdated({ userId, status: next });
  }
}
