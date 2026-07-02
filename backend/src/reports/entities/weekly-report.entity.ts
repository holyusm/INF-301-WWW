import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DailySales } from './daily-sales.entity';

@Entity('weekly_reports')
export class WeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  weekId: string; // '2026-W21'

  @Column({ type: 'numeric', precision: 12, scale: 0, default: 0 })
  totalRevenue: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  // Sin cascade: DailySales siempre se crea/actualiza explícitamente vía su
  // propio repositorio en ReportsService.registerSale(). Con cascade:true,
  // guardar un WeeklyReport con este array en memoria desactualizado (p.ej.
  // el `[]` cargado antes de insertar el DailySales del día) hacía que
  // TypeORM desasociara (weeklyReportId = NULL) los hijos recién creados.
  @OneToMany(() => DailySales, (d) => d.weeklyReport, {
    eager: true,
  })
  dailySales: DailySales[];

  @CreateDateColumn()
  generatedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
