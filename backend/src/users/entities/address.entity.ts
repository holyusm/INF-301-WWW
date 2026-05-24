import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('saved_addresses')
export class SavedAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  label: string;

  @Column()
  address: string;

  @Column()
  commune: string;

  @CreateDateColumn()
  createdAt: Date;
}
