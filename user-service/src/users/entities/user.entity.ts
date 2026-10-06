import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AvailabilitySlot } from "./availability-slot.entity";
import { RefreshToken } from "./refresh-token.entity";
import { TutorCredential } from "./tutor-credential.entity";

export enum UserRole {
  STUDENT = "student",
  TUTOR = "tutor",
  ADMIN = "admin",
}

// Documento primario de EduConecta, sección 2 (User Service): "verificación
// de identidad y credenciales académicas de los tutores ... mediante un
// flujo de aprobación manual antes de su publicación en el catálogo", y
// sección 3: "estados (pendiente, aprobado, rechazado)". NOT_SUBMITTED es
// un cuarto estado propio (no está en el documento) para distinguir "aún no
// sometió ninguna credencial" de "las sometió y está en cola de revisión".
export enum TutorVerificationStatus {
  NOT_SUBMITTED = "not_submitted",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: "enum", enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  full_name: string;

  // Solo tiene sentido para role=tutor; queda NOT_SUBMITTED por defecto
  // (también para student/admin, donde simplemente se ignora).
  @Column({
    type: "enum",
    enum: TutorVerificationStatus,
    default: TutorVerificationStatus.NOT_SUBMITTED,
  })
  tutor_verification_status: TutorVerificationStatus;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => AvailabilitySlot, (slot) => slot.user)
  availabilitySlots: AvailabilitySlot[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => TutorCredential, (c) => c.user)
  credentials: TutorCredential[];
}
