import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  CLIENTE = 'cliente',
  ADMIN = 'admin',
  CAJERO = 'cajero',
  DESPACHADOR = 'despachador',
  DUENO = 'dueno',
}

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENTE })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  /** Referencia lógica al UserProfile del módulo users */
  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
