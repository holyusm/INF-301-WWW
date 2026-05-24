import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum OrderStatus {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
  PREPARANDO = 'preparando',
  EN_CAMINO = 'en_camino',
  ENTREGADO = 'entregado',
  ANULADO = 'anulado',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ type: 'numeric', precision: 10, scale: 0 })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  order: Order;

  getSubtotal(): number {
    return Number(this.unitPrice) * this.quantity;
  }
}
