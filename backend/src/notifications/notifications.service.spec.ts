import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationType,
} from './entities/notification.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: MockRepository<Notification>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repo = module.get<MockRepository<Notification>>(
      getRepositoryToken(Notification),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create and save a notification successfully', async () => {
      const dto = {
        userId: 'user-uuid-1',
        type: NotificationType.ORDER_CONFIRMED,
        message: 'Test message',
      };
      const notification = { id: 'notif-uuid-1', ...dto, read: false };

      repo.create!.mockReturnValue(notification);
      repo.save!.mockResolvedValue(notification);

      const result = await service.createNotification(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(notification);
      expect(result).toEqual(notification);
    });
  });

  describe('getByUser', () => {
    it('should return notifications ordered by createdAt DESC, limited to 50', async () => {
      const userId = 'user-uuid-1';
      const notifications: Partial<Notification>[] = [
        {
          id: 'notif-2',
          userId,
          type: NotificationType.ORDER_STATUS_CHANGED,
          message: 'Status changed',
          read: false,
          createdAt: new Date('2026-05-23'),
        },
        {
          id: 'notif-1',
          userId,
          type: NotificationType.ORDER_CONFIRMED,
          message: 'Confirmed',
          read: true,
          createdAt: new Date('2026-05-22'),
        },
      ];

      repo.find!.mockResolvedValue(notifications);

      const result = await service.getByUser(userId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(notifications);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read when it belongs to the user', async () => {
      const userId = 'user-uuid-1';
      const notification: Partial<Notification> = {
        id: 'notif-uuid-1',
        userId,
        type: NotificationType.ORDER_CONFIRMED,
        message: 'Confirmed',
        read: false,
      };
      const updated = { ...notification, read: true };

      repo.findOne!.mockResolvedValue(notification);
      repo.save!.mockResolvedValue(updated);

      const result = await service.markAsRead('notif-uuid-1', userId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'notif-uuid-1' },
      });
      expect(result.read).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      repo.findOne!.mockResolvedValue(null);

      await expect(
        service.markAsRead('non-existent', 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if notification does not belong to user', async () => {
      const notification: Partial<Notification> = {
        id: 'notif-uuid-1',
        userId: 'other-user-uuid',
        read: false,
      };

      repo.findOne!.mockResolvedValue(notification);

      await expect(
        service.markAsRead('notif-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('notifyOrderConfirmed', () => {
    it('should create a notification with type ORDER_CONFIRMED', async () => {
      const userId = 'user-uuid-1';
      const orderId = 'order-uuid-1';
      const expectedNotification: Partial<Notification> = {
        id: 'notif-uuid-1',
        userId,
        type: NotificationType.ORDER_CONFIRMED,
        message: `Tu pedido #${orderId} ha sido confirmado. ¡Estamos preparando tu sushi!`,
        read: false,
      };

      repo.create!.mockReturnValue(expectedNotification);
      repo.save!.mockResolvedValue(expectedNotification);

      const result = await service.notifyOrderConfirmed(userId, orderId);

      expect(result.type).toBe(NotificationType.ORDER_CONFIRMED);
      expect(result.userId).toBe(userId);
    });
  });

  describe('notifyStatusChanged', () => {
    it('should create a notification with the new status in the message', async () => {
      const userId = 'user-uuid-1';
      const orderId = 'order-uuid-1';
      const newStatus = 'en camino';
      const expectedMessage = `El estado de tu pedido #${orderId} ha cambiado a: ${newStatus}.`;
      const expectedNotification: Partial<Notification> = {
        id: 'notif-uuid-2',
        userId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        message: expectedMessage,
        read: false,
      };

      repo.create!.mockReturnValue(expectedNotification);
      repo.save!.mockResolvedValue(expectedNotification);

      const result = await service.notifyStatusChanged(
        userId,
        orderId,
        newStatus,
      );

      expect(result.type).toBe(NotificationType.ORDER_STATUS_CHANGED);
      expect(result.message).toContain(newStatus);
      expect(result.message).toContain(orderId);
    });
  });
});
