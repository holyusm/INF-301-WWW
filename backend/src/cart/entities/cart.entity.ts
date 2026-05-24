import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToMany(() => CartItem, (i) => i.cart, { cascade: true, eager: true })
  items: CartItem[];

  @UpdateDateColumn()
  updatedAt: Date;
}
