import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from "typeorm";
import { SignalType, SignalSource } from "../interfaces/signal.interface";

@Entity("bcc_signals")
@Index(["tenantId", "createdAt"]) // Optimize for tenant-specific time-range queries
export class BccSignal {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "enum",
        enum: SignalType,
    })
    type: SignalType;

    @Column({
        type: "enum",
        enum: SignalSource,
    })
    source: SignalSource;

    @Column({ type: "float" })
    intensity: number;

    @Column({ type: "text", nullable: true })
    message: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @Index() // Crucial for RLS and filtering
    @Column()
    tenantId: string;

    @Column({ nullable: true })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
