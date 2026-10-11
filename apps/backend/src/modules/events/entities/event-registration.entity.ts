import { Entity, Column, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../core/database/entities/base.entity";
import { User } from "../../users/entities/user.entity";
import { Event } from "./event.entity";

@Entity("event_registrations")
export class EventRegistration extends BaseEntity {
  @ManyToOne("User", "id", { nullable: true })
  user: User | null;

  @ManyToOne("Event", "id")
  event: Event;

  @Column({ type: "varchar", nullable: true })
  guestName: string | null;

  @Column({ type: "varchar", nullable: true })
  guestEmail: string | null;

  @Column({ type: "varchar", default: "pending" })
  status: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: "jsonb", nullable: true })
  paymentDetails: Record<string, any>;

  @Column({ type: "timestamp", nullable: true })
  checkedInAt: Date;

  @Column({ type: "jsonb", nullable: true })
  additionalInfo: Record<string, any>;
}
