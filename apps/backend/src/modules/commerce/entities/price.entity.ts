import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('prices')
export class Price {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, nullable: true })
    stripePriceId: string;

    @ManyToOne(() => Product, product => product.prices)
    product: Product;

    @Column()
    productId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'usd' })
    currency: string;

    @Column({ default: 'month' }) // 'month', 'year', 'one_time'
    interval: string;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
