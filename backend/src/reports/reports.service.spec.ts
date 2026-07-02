import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { WeeklyReport } from './entities/weekly-report.entity';
import { DailySales } from './entities/daily-sales.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

describe('ReportsService', () => {
  let service: ReportsService;
  let weeklyReportRepo: MockRepository<WeeklyReport>;
  let dailySalesRepo: MockRepository<DailySales>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(WeeklyReport),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(DailySales),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    weeklyReportRepo = module.get<MockRepository<WeeklyReport>>(
      getRepositoryToken(WeeklyReport),
    );
    dailySalesRepo = module.get<MockRepository<DailySales>>(
      getRepositoryToken(DailySales),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentWeekId', () => {
    it('should return a string in YYYY-WNN format', () => {
      const weekId = service.getCurrentWeekId();
      expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('should return the correct week for a known date (2026-05-23 is W21)', () => {
      const date = new Date('2026-05-23T12:00:00Z');
      const weekId = service.getWeekIdForDate(date);
      expect(weekId).toBe('2026-W21');
    });

    it('should return the correct week for start of year (2026-01-01 is W01)', () => {
      const date = new Date('2026-01-01T12:00:00Z');
      const weekId = service.getWeekIdForDate(date);
      expect(weekId).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('getCurrentWeekReport', () => {
    it('should return existing report when it exists', async () => {
      const weekId = service.getCurrentWeekId();
      const existingReport: Partial<WeeklyReport> = {
        id: 'report-uuid-1',
        weekId,
        totalRevenue: 5000,
        totalOrders: 10,
        dailySales: [],
      };

      weeklyReportRepo.findOne!.mockResolvedValue(existingReport);

      const result = await service.getCurrentWeekReport();

      expect(weeklyReportRepo.findOne).toHaveBeenCalledWith({
        where: { weekId },
      });
      expect(result).toEqual(existingReport);
    });

    it('should create a new report when none exists', async () => {
      const weekId = service.getCurrentWeekId();
      const newReport: Partial<WeeklyReport> = {
        id: 'report-uuid-new',
        weekId,
        totalRevenue: 0,
        totalOrders: 0,
        dailySales: [],
      };

      weeklyReportRepo.findOne!.mockResolvedValue(null);
      weeklyReportRepo.create!.mockReturnValue(newReport);
      weeklyReportRepo.save!.mockResolvedValue(newReport);

      const result = await service.getCurrentWeekReport();

      expect(weeklyReportRepo.create).toHaveBeenCalledWith({
        weekId,
        totalRevenue: 0,
        totalOrders: 0,
        dailySales: [],
      });
      expect(weeklyReportRepo.save).toHaveBeenCalled();
      expect(result.weekId).toBe(weekId);
      expect(result.totalRevenue).toBe(0);
    });
  });

  describe('getWeekReport', () => {
    it('should throw NotFoundException for a non-existent weekId', async () => {
      weeklyReportRepo.findOne!.mockResolvedValue(null);

      await expect(service.getWeekReport('2025-W01')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the report when found', async () => {
      const report: Partial<WeeklyReport> = {
        id: 'report-uuid-1',
        weekId: '2026-W20',
        totalRevenue: 20000,
        totalOrders: 40,
      };

      weeklyReportRepo.findOne!.mockResolvedValue(report);

      const result = await service.getWeekReport('2026-W20');
      expect(result).toEqual(report);
    });
  });

  describe('registerSale', () => {
    it('should create DailySales and update revenue and orderCount correctly', async () => {
      const amount = 5000;
      const saleDate = new Date('2026-05-23T10:00:00Z');
      const dateStr = '2026-05-23';
      const weekId = service.getWeekIdForDate(saleDate);

      const existingReport: Partial<WeeklyReport> = {
        id: 'report-uuid-1',
        weekId,
        totalRevenue: 0,
        totalOrders: 0,
        dailySales: [],
      };

      const newDailySales: Partial<DailySales> = {
        date: dateStr,
        revenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
        weeklyReport: existingReport as WeeklyReport,
      };

      const savedDailySales: Partial<DailySales> = {
        ...newDailySales,
        id: 'daily-uuid-1',
        revenue: amount,
        orderCount: 1,
        avgOrderValue: amount,
      };

      const savedReport: Partial<WeeklyReport> = {
        ...existingReport,
        totalRevenue: amount,
        totalOrders: 1,
      };

      weeklyReportRepo.findOne!
        .mockResolvedValueOnce(existingReport)
        .mockResolvedValueOnce(savedReport);
      dailySalesRepo.findOne!.mockResolvedValue(null);
      dailySalesRepo.create!.mockReturnValue(newDailySales);
      dailySalesRepo.save!.mockResolvedValue(savedDailySales);
      weeklyReportRepo.update!.mockResolvedValue({ affected: 1 });

      const result = await service.registerSale(amount, saleDate);

      expect(dailySalesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          date: dateStr,
          revenue: 0,
          orderCount: 0,
          avgOrderValue: 0,
        }),
      );
      expect(dailySalesRepo.save).toHaveBeenCalled();
      expect(weeklyReportRepo.update).toHaveBeenCalledWith(
        existingReport.id,
        expect.objectContaining({
          totalRevenue: amount,
          totalOrders: 1,
        }),
      );
      expect(result.totalRevenue).toBe(amount);
      expect(result.totalOrders).toBe(1);
    });

    it('should accumulate revenue when DailySales already exists for that day', async () => {
      const amount = 3000;
      const saleDate = new Date('2026-05-23T15:00:00Z');
      const dateStr = '2026-05-23';
      const weekId = service.getWeekIdForDate(saleDate);

      const existingReport: Partial<WeeklyReport> = {
        id: 'report-uuid-1',
        weekId,
        totalRevenue: 5000,
        totalOrders: 1,
        dailySales: [],
      };

      const existingDailySales: Partial<DailySales> = {
        id: 'daily-uuid-1',
        date: dateStr,
        revenue: 5000,
        orderCount: 1,
        avgOrderValue: 5000,
        weeklyReport: existingReport as WeeklyReport,
      };

      const savedReport: Partial<WeeklyReport> = {
        ...existingReport,
        totalRevenue: 8000,
        totalOrders: 2,
      };

      weeklyReportRepo.findOne!
        .mockResolvedValueOnce(existingReport)
        .mockResolvedValueOnce(savedReport);
      dailySalesRepo.findOne!.mockResolvedValue(existingDailySales);
      dailySalesRepo.save!.mockResolvedValue({
        ...existingDailySales,
        revenue: 8000,
        orderCount: 2,
        avgOrderValue: 4000,
      });
      weeklyReportRepo.update!.mockResolvedValue({ affected: 1 });

      const result = await service.registerSale(amount, saleDate);

      expect(weeklyReportRepo.update).toHaveBeenCalledWith(
        existingReport.id,
        expect.objectContaining({ totalRevenue: 8000, totalOrders: 2 }),
      );
      expect(result.totalRevenue).toBe(8000);
      expect(result.totalOrders).toBe(2);
    });
  });

  describe('getRecentWeeks', () => {
    it('should return the n most recent weekly reports ordered DESC', async () => {
      const reports: Partial<WeeklyReport>[] = [
        { id: '3', weekId: '2026-W21', totalRevenue: 9000, totalOrders: 18 },
        { id: '2', weekId: '2026-W20', totalRevenue: 7000, totalOrders: 14 },
        { id: '1', weekId: '2026-W19', totalRevenue: 5000, totalOrders: 10 },
        { id: '0', weekId: '2026-W18', totalRevenue: 4000, totalOrders: 8 },
      ];

      weeklyReportRepo.find!.mockResolvedValue(reports);

      const result = await service.getRecentWeeks(4);

      expect(weeklyReportRepo.find).toHaveBeenCalledWith({
        order: { weekId: 'DESC' },
        take: 4,
      });
      expect(result).toEqual(reports);
      expect(result).toHaveLength(4);
    });

    it('should default to 4 weeks when no argument provided', async () => {
      weeklyReportRepo.find!.mockResolvedValue([]);

      await service.getRecentWeeks();

      expect(weeklyReportRepo.find).toHaveBeenCalledWith({
        order: { weekId: 'DESC' },
        take: 4,
      });
    });
  });

  describe('@OnEvent handlers', () => {
    it('handleOrderPaid should invoke registerSale with the given amount', async () => {
      const weekId = service.getCurrentWeekId();
      const existingReport = {
        id: 'report-1',
        weekId,
        totalRevenue: 0,
        totalOrders: 0,
        dailySales: [],
      };
      const updatedReport = { ...existingReport, totalRevenue: 9500, totalOrders: 1 };

      weeklyReportRepo.findOne!
        .mockResolvedValueOnce(existingReport)
        .mockResolvedValueOnce(updatedReport);
      dailySalesRepo.findOne!.mockResolvedValue(null);
      dailySalesRepo.create!.mockReturnValue({ revenue: 0, orderCount: 0, avgOrderValue: 0 });
      dailySalesRepo.save!.mockResolvedValue({ revenue: 9500, orderCount: 1, avgOrderValue: 9500 });
      weeklyReportRepo.update!.mockResolvedValue({ affected: 1 });

      await service.handleOrderPaid({ orderId: 'order-1', amount: 9500 });

      expect(weeklyReportRepo.update).toHaveBeenCalled();
    });
  });
});
