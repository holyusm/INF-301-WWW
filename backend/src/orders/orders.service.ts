import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem, OrderStatus } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

/** Valid transitions: key -> set of allowed next states */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDIENTE]: [OrderStatus.PAGADO, OrderStatus.ANULADO],
  [OrderStatus.PAGADO]: [OrderStatus.PREPARANDO],
  [OrderStatus.PREPARANDO]: [OrderStatus.EN_CAMINO],
  [OrderStatus.EN_CAMINO]: [OrderStatus.ENTREGADO],
  [OrderStatus.ENTREGADO]: [],
  [OrderStatus.ANULADO]: [],
};

/** Roles that may call updateStatus and what transitions they are allowed */
const ROLE_ALLOWED_TARGETS: Record<string, OrderStatus[]> = {
  cajero: [OrderStatus.PAGADO],
  despachador: [OrderStatus.EN_CAMINO, OrderStatus.ENTREGADO],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const items = dto.items.map((itemDto) => {
      const item = this.itemRepo.create({
        productId: itemDto.productId,
        productName: itemDto.productName,
        unitPrice: itemDto.unitPrice,
        quantity: itemDto.quantity,
      });
      return item;
    });

    const order = this.orderRepo.create({
      userId,
      deliveryAddress: dto.deliveryAddress,
      paymentMethod: dto.paymentMethod,
      total: dto.total,
      status: OrderStatus.PENDIENTE,
      items,
    });

    return this.orderRepo.save(order);
  }

  async getOrderById(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Pedido con id "${id}" no encontrado`);
    }
    return order;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    requestingUserRole: string,
  ): Promise<Order> {
    const order = await this.getOrderById(id);

    // Validate state machine transition
    if (!this.canTransitionTo(order.status, dto.status)) {
      throw new BadRequestException(
        `Transición inválida: no se puede pasar de "${order.status}" a "${dto.status}"`,
      );
    }

    // cancelReason is required when cancelling
    if (dto.status === OrderStatus.ANULADO && !dto.cancelReason) {
      throw new BadRequestException(
        'Se requiere cancelReason al anular un pedido',
      );
    }

    // Role-based restriction (admin and dueno can do any transition)
    const role = requestingUserRole?.toLowerCase();
    if (role !== 'admin' && role !== 'dueno') {
      const allowed = ROLE_ALLOWED_TARGETS[role];
      if (!allowed || !allowed.includes(dto.status)) {
        throw new ForbiddenException(
          `El rol "${role}" no está autorizado para cambiar el estado a "${dto.status}"`,
        );
      }
    }

    order.status = dto.status;
    if (dto.cancelReason) {
      order.cancelReason = dto.cancelReason;
    }

    return this.orderRepo.save(order);
  }

  canTransitionTo(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  async deleteOrder(id: string): Promise<void> {
    const order = await this.getOrderById(id);
    if (order.status !== OrderStatus.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden eliminar pedidos en estado PENDIENTE',
      );
    }
    await this.orderRepo.remove(order);
  }
}
