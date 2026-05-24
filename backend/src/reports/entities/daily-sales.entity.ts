import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';

@Entity('daily_sales')
export class DailySales {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string; // '2026-05-23'

  @Column({ type: 'numeric', precision: 12, scale: 0, default: 0 })
  revenue: number;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  avgOrderValue: number;

  @ManyToOne(() => WeeklyReport, (r) => r.dailySales, { onDelete: 'CASCADE' })
  weeklyReport: WeeklyReport;
}
