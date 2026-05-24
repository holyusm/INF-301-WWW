import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  CLIENTE = 'cliente',
  ADMIN = 'admin',
  CAJERO = 'cajero',
  DESPACHADOR = 'despachador',
  DUENO = 'dueno',
}

export enum UserGender {
  M = 'M',
  F = 'F',
  OTRO = 'otro',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  run: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column()
  commune: string;

  @Column()
  province: string;

  @Column()
  region: string;

  @Column({ nullable: true })
  birthDate: string;

  @Column({ type: 'enum', enum: UserGender, default: UserGender.OTRO })
  gender: UserGender;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENTE })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
