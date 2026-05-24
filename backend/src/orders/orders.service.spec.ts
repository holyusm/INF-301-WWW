import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem, OrderStatus } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const mockOrderRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockItemRepo = () => ({
  create: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: ReturnType<typeof mockOrderRepo>;
  let itemRepo: ReturnType<typeof mockItemRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockItemRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepo = module.get(getRepositoryToken(Order));
    itemRepo = module.get(getRepositoryToken(OrderItem));
  });

  // -----------------------------------------------------------------------
  // createOrder
  // -----------------------------------------------------------------------
  describe('createOrder', () => {
    it('should create an order with the correct items', async () => {
      const dto: CreateOrderDto = {
        deliveryAddress: 'Av. Principal 123',
        paymentMethod: 'tarjeta',
        total: 15000,
        items: [
          {
            productId: 'prod-1',
            productName: 'Salmón Roll',
            unitPrice: 7500,
            quantity: 2,
          },
        ],
      };

      const builtItem = { ...dto.items[0] };
      const builtOrder = {
        userId: 'user-1',
        ...dto,
        items: [builtItem],
        status: OrderStatus.PENDIENTE,
      };
      const savedOrder = { id: 'order-uuid', ...builtOrder };

      itemRepo.create.mockReturnValue(builtItem);
      orderRepo.create.mockReturnValue(builtOrder);
      orderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.createOrder('user-1', dto);

      expect(itemRepo.create).toHaveBeenCalledWith({
        productId: 'prod-1',
        productName: 'Salmón Roll',
        unitPrice: 7500,
        quantity: 2,
      });
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          deliveryAddress: dto.deliveryAddress,
          total: dto.total,
          status: OrderStatus.PENDIENTE,
        }),
      );
      expect(result).toEqual(savedOrder);
    });
  });

  // -----------------------------------------------------------------------
  // getOrderById
  // -----------------------------------------------------------------------
  describe('getOrderById', () => {
    it('should return the order when found', async () => {
      const order = { id: 'order-1', userId: 'u1' };
      orderRepo.findOne.mockResolvedValue(order);

      const result = await service.getOrderById('order-1');
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrderById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // getOrdersByUser
  // -----------------------------------------------------------------------
  describe('getOrdersByUser', () => {
    it('should return orders for the given user ordered by createdAt DESC', async () => {
      const orders = [
        { id: 'o2', userId: 'u1', createdAt: new Date('2024-02-01') },
        { id: 'o1', userId: 'u1', createdAt: new Date('2024-01-01') },
      ];
      orderRepo.find.mockResolvedValue(orders);

      const result = await service.getOrdersByUser('u1');

      expect(orderRepo.find).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(orders);
    });
  });

  // -----------------------------------------------------------------------
  // getAllOrders
  // -----------------------------------------------------------------------
  describe('getAllOrders', () => {
    it('should return all orders', async () => {
      const orders = [{ id: 'o1' }, { id: 'o2' }];
      orderRepo.find.mockResolvedValue(orders);

      const result = await service.getAllOrders();
      expect(result).toEqual(orders);
    });
  });

  // -----------------------------------------------------------------------
  // updateStatus
  // -----------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should update the status for a valid transition (admin)', async () => {
      const order = {
        id: 'o1',
        status: OrderStatus.PENDIENTE,
        cancelReason: null,
      };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.PAGADO });

      const dto: UpdateStatusDto = { status: OrderStatus.PAGADO };
      const result = await service.updateStatus('o1', dto, 'admin');

      expect(result.status).toBe(OrderStatus.PAGADO);
    });

    it('should throw BadRequestException for an invalid transition', async () => {
      const order = { id: 'o1', status: OrderStatus.ENTREGADO };
      orderRepo.findOne.mockResolvedValue(order);

      const dto: UpdateStatusDto = { status: OrderStatus.PENDIENTE };
      await expect(
        service.updateStatus('o1', dto, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cancelling without cancelReason', async () => {
      const order = { id: 'o1', status: OrderStatus.PENDIENTE };
      orderRepo.findOne.mockResolvedValue(order);

      const dto: UpdateStatusDto = { status: OrderStatus.ANULADO };
      await expect(
        service.updateStatus('o1', dto, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow cajero to change status to PAGADO', async () => {
      const order = { id: 'o1', status: OrderStatus.PENDIENTE };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: OrderStatus.PAGADO });

      const dto: UpdateStatusDto = { status: OrderStatus.PAGADO };
      const result = await service.updateStatus('o1', dto, 'cajero');
      expect(result.status).toBe(OrderStatus.PAGADO);
    });

    it('should throw ForbiddenException when cajero tries to change to PREPARANDO', async () => {
      const order = { id: 'o1', status: OrderStatus.PAGADO };
      orderRepo.findOne.mockResolvedValue(order);

      const dto: UpdateStatusDto = { status: OrderStatus.PREPARANDO };
      await expect(
        service.updateStatus('o1', dto, 'cajero'),
      ).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // canTransitionTo
  // -----------------------------------------------------------------------
  describe('canTransitionTo', () => {
    const validTransitions: [OrderStatus, OrderStatus][] = [
      [OrderStatus.PENDIENTE, OrderStatus.PAGADO],
      [OrderStatus.PENDIENTE, OrderStatus.ANULADO],
      [OrderStatus.PAGADO, OrderStatus.PREPARANDO],
      [OrderStatus.PREPARANDO, OrderStatus.EN_CAMINO],
      [OrderStatus.EN_CAMINO, OrderStatus.ENTREGADO],
    ];

    it.each(validTransitions)(
      'should return true for %s -> %s',
      (current, next) => {
        expect(service.canTransitionTo(current, next)).toBe(true);
      },
    );

    const invalidTransitions: [OrderStatus, OrderStatus][] = [
      [OrderStatus.PAGADO, OrderStatus.ANULADO],
      [OrderStatus.ENTREGADO, OrderStatus.PENDIENTE],
      [OrderStatus.ANULADO, OrderStatus.PAGADO],
      [OrderStatus.PREPARANDO, OrderStatus.PAGADO],
      [OrderStatus.EN_CAMINO, OrderStatus.PREPARANDO],
    ];

    it.each(invalidTransitions)(
      'should return false for %s -> %s',
      (current, next) => {
        expect(service.canTransitionTo(current, next)).toBe(false);
      },
    );
  });
});
