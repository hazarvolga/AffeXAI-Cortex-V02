import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Price } from './price.entity';

export enum SubscriptionStatus {
    ACTIVE = 'active',
    CANCELED = 'canceled',
    PAST_DUE = 'past_due',
    TRIALING = 'trialing',
    INCOMPLETE = 'incomplete',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tenantId: string;

    @Column({ unique: true, nullable: true })
    stripeSubscriptionId: string;

    @Column({ nullable: true })
    stripeCustomerId: string;

    @ManyToOne(() => Price)
    price: Price;

    @Column()
    priceId: string;

    @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    @Column('timestamp', { nullable: true })
    currentPeriodStart: Date;

    @Column('timestamp', { nullable: true })
    currentPeriodEnd: Date;

    @Column({ default: false })
    cancelAtPeriodEnd: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
