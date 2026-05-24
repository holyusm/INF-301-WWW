import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum PaymentStatus {
  PROCESANDO = 'procesando',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column({ type: 'numeric', precision: 10, scale: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PROCESANDO,
  })
  status: PaymentStatus;

  /** 'tarjeta' | 'servipag' | 'transferencia' */
  @Column()
  methodType: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  processedAt: Date;
}
