import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { DailySales } from './entities/daily-sales.entity';
import { WeeklyReport } from './entities/weekly-report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WeeklyReport)
    private readonly weeklyReportRepo: Repository<WeeklyReport>,
    @InjectRepository(DailySales)
    private readonly dailySalesRepo: Repository<DailySales>,
  ) {}

  /**
   * Returns the ISO week ID for the current date in 'YYYY-WNN' format.
   * Example: '2026-W21'
   */
  getCurrentWeekId(): string {
    return this.getWeekIdForDate(new Date());
  }

  /**
   * Returns the ISO week ID for a given date in 'YYYY-WNN' format.
   * Uses ISO 8601: week 1 is the week containing the first Thursday of the year.
   */
  getWeekIdForDate(date: Date): string {
    const d = new Date(date);
    // Set to nearest Thursday: current date + 4 - current day number (Mon=1..Sun=7)
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // Sunday=7 for ISO
    d.setDate(d.getDate() + 4 - dayOfWeek);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    const year = d.getFullYear();
    const week = String(weekNumber).padStart(2, '0');
    return `${year}-W${week}`;
  }

  async getCurrentWeekReport(): Promise<WeeklyReport> {
    const weekId = this.getCurrentWeekId();
    return this.findOrCreateWeekReport(weekId);
  }

  async getWeekReport(weekId: string): Promise<WeeklyReport> {
    const report = await this.weeklyReportRepo.findOne({ where: { weekId } });
    if (!report) {
      throw new NotFoundException(
        `Weekly report for week "${weekId}" not found`,
      );
    }
    return report;
  }

  private async findOrCreateWeekReport(weekId: string): Promise<WeeklyReport> {
    let report = await this.weeklyReportRepo.findOne({ where: { weekId } });
    if (!report) {
      report = this.weeklyReportRepo.create({
        weekId,
        totalRevenue: 0,
        totalOrders: 0,
        dailySales: [],
      });
      report = await this.weeklyReportRepo.save(report);
    }
    return report;
  }

  /**
   * Registers a sale for a given date (defaults to now).
   * Finds or creates the WeeklyReport and DailySales for that date,
   * then updates all aggregated totals.
   */
  async registerSale(amount: number, date?: Date): Promise<WeeklyReport> {
    const saleDate = date ?? new Date();
    const weekId = this.getWeekIdForDate(saleDate);

    // Format date as 'YYYY-MM-DD'
    const dateStr = saleDate.toISOString().split('T')[0];

    // Get or create weekly report
    const report = await this.findOrCreateWeekReport(weekId);

    // Find existing DailySales for this date
    let dailySales = await this.dailySalesRepo.findOne({
      where: { date: dateStr, weeklyReport: { id: report.id } },
      relations: ['weeklyReport'],
    });

    if (!dailySales) {
      dailySales = this.dailySalesRepo.create({
        date: dateStr,
        revenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        weeklyReport: report,
      });
    }

    // Update daily totals
    dailySales.revenue = Number(dailySales.revenue) + amount;
    dailySales.orderCount = Number(dailySales.orderCount) + 1;
    dailySales.avgOrderValue =
      Math.round((dailySales.revenue / dailySales.orderCount) * 100) / 100;

    await this.dailySalesRepo.save(dailySales);

    // Update weekly totals
    report.totalRevenue = Number(report.totalRevenue) + amount;
    report.totalOrders = Number(report.totalOrders) + 1;

    return this.weeklyReportRepo.save(report);
  }

  async getRecentWeeks(n = 4): Promise<WeeklyReport[]> {
    return this.weeklyReportRepo.find({
      order: { weekId: 'DESC' },
      take: n,
    });
  }

  @OnEvent('order.paid')
  async handleOrderPaid(payload: {
    orderId: string;
    amount: number;
  }): Promise<void> {
    await this.registerSale(payload.amount);
  }
}
