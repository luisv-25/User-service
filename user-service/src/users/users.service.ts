import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole, TutorVerificationStatus } from "./entities/user.entity";
import { AvailabilitySlot } from "./entities/availability-slot.entity";
import { EventsPublisher } from "../events/events.publisher";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(AvailabilitySlot)
    private readonly slotsRepo: Repository<AvailabilitySlot>,
    private readonly eventsPublisher: EventsPublisher,
  ) {}

  // Lista de usuarios para las pestañas "Tutores"/"Estudiantes" del
  // frontend; filtra por rol cuando se pide (?role=student|tutor), y
  // opcionalmente por estado de verificación (?verificationStatus=pending)
  // para la cola de revisión del admin.
  async findAll(role?: UserRole, verificationStatus?: TutorVerificationStatus) {
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (verificationStatus) where.tutor_verification_status = verificationStatus;
    const users = await this.usersRepo.find({ where, order: { created_at: "DESC" } });
    return users.map((u) => this.toPublicProfile(u));
  }

  // Solo un admin puede eliminar cuentas (ver permisos de rol admin).
  // Publica user.deleted para que Catalog limpie el tutor_profile asociado
  // si el usuario eliminado era tutor.
  async deleteUser(id: string) {
    const user = await this.findById(id);
    await this.usersRepo.remove(user);
    this.eventsPublisher.publishUserDeleted({ userId: id, role: user.role });
    return { deleted: true, userId: id };
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ["availabilitySlots"],
    });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  createUser(data: Partial<User>) {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async getAvailability(userId: string) {
    await this.findById(userId); // valida que exista
    return this.slotsRepo.find({ where: { user: { id: userId } } });
  }

  async setAvailability(
    userId: string,
    slots: { day_of_week: number; start_time: string; end_time: string }[],
  ) {
    const user = await this.findById(userId);
    await this.slotsRepo.delete({ user: { id: userId } });
    const created = slots.map((s) =>
      this.slotsRepo.create({ ...s, user }),
    );
    return this.slotsRepo.save(created);
  }

  // Proyección pública mínima: lo único que otros servicios (Catalog) deben ver.
  // tutorVerificationStatus va incluido para que Catalog pueda, a futuro,
  // filtrar tutores no aprobados antes de publicarlos (documento primario,
  // sección 2 de User Service).
  toPublicProfile(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      tutorVerificationStatus: user.role === UserRole.TUTOR ? user.tutor_verification_status : undefined,
    };
  }
}
