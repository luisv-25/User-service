import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

// Documento primario de EduConecta, sección 4 (Estrategia de Base de
// Datos): "tutor_credentials (tutor_id, document_url, verified,
// verified_at, verified_by)". Se modela un registro por documento (un
// tutor puede subir título, certificación y referencias por separado),
// cada uno con su propio estado — en vez de un único booleano "verified"
// para todo el tutor, que es lo que agrega User.tutor_verification_status.
export enum CredentialType {
  TITULO = "titulo",
  CERTIFICACION = "certificacion",
  REFERENCIA = "referencia",
}

export enum CredentialStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("tutor_credentials")
@Index(["user"])
export class TutorCredential {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.credentials, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "enum", enum: CredentialType })
  document_type: CredentialType;

  @Column()
  document_url: string;

  @Column({ type: "enum", enum: CredentialStatus, default: CredentialStatus.PENDING })
  status: CredentialStatus;

  @Column({ type: "timestamptz", nullable: true })
  verified_at: Date | null;

  // Referencia lógica al admin que aprobó/rechazó (users.id), sin FK
  // física porque es el mismo patrón usado en el resto del sistema para
  // referencias dentro de la misma base — aquí sí es la misma tabla
  // (users), pero se deja como columna simple para no complicar con una
  // segunda relación ManyToOne sobre la misma entidad.
  @Column({ type: "uuid", nullable: true })
  verified_by: string | null;

  @CreateDateColumn()
  created_at: Date;
}
