import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Price } from './price.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    stripeProductId: string; // For future sync

    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    active: boolean;

    @Column('jsonb', { nullable: true })
    metadata: Record<string, any>; // Store features like { "ai_tokens": 50000, "rag_enabled": true }

    @Column('jsonb', { nullable: true })
    features: string[]; // List of display features

    @Column({ default: true })
    isPublic: boolean;

    @OneToMany(() => Price, price => price.product)
    prices: Price[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
