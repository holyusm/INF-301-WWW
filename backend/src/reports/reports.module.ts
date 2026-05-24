import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { WeeklyReport } from './entities/weekly-report.entity';
import { DailySales } from './entities/daily-sales.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeeklyReport, DailySales]), AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
