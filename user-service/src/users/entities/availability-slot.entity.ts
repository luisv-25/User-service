import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("availability_slots")
@Index(["user", "day_of_week"])
@Check(`"start_time" < "end_time"`)
export class AvailabilitySlot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.availabilitySlots, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  day_of_week: number; // 0-6

  @Column({ type: "time" })
  start_time: string;

  @Column({ type: "time" })
  end_time: string;
}
