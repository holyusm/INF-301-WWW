import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  Notification,
  NotificationType,
} from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create(dto);
    return this.notificationRepo.save(notification);
  }

  async getByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: { id } });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this notification',
      );
    }

    notification.read = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, read: false }, { read: true });
  }

  async notifyOrderConfirmed(
    userId: string,
    orderId: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.ORDER_CONFIRMED,
      message: `Tu pedido #${orderId} ha sido confirmado. ¡Estamos preparando tu sushi!`,
    });
  }

  async notifyStatusChanged(
    userId: string,
    orderId: string,
    newStatus: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      message: `El estado de tu pedido #${orderId} ha cambiado a: ${newStatus}.`,
    });
  }

  async notifyOrderCancelled(
    userId: string,
    orderId: string,
    reason: string,
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.ORDER_CANCELLED,
      message: `Tu pedido #${orderId} ha sido cancelado. Motivo: ${reason}.`,
    });
  }
}
