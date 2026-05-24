import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserGender {
  M = 'M',
  F = 'F',
  OTRO = 'otro',
}

/** Perfil de usuario: datos personales y de contacto. */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  run: string;

  @Column()
  fullName: string;

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

  @CreateDateColumn()
  createdAt: Date;
}
