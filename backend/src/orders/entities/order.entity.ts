import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem, OrderStatus } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDIENTE,
  })
  status: OrderStatus;

  @Column({ type: 'numeric', precision: 10, scale: 0 })
  total: number;

  @Column()
  deliveryAddress: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  cancelReason: string;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
