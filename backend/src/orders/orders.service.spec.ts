import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem, OrderStatus } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '../payments/entities/payment.entity';

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

const mockEventEmitter = { emit: jest.fn() };
const mockPaymentsService = { processPayment: jest.fn() };

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: ReturnType<typeof mockOrderRepo>;
  let itemRepo: ReturnType<typeof mockItemRepo>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useFactory: mockItemRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: PaymentsService, useValue: mockPaymentsService },
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

    it('should emit order.created event after saving', async () => {
      const dto: CreateOrderDto = {
        deliveryAddress: 'Av. Principal 123',
        paymentMethod: 'tarjeta',
        total: 8000,
        items: [
          {
            productId: 'prod-2',
            productName: 'Maki Roll',
            unitPrice: 8000,
            quantity: 1,
          },
        ],
      };
      const savedOrder = {
        id: 'order-emit-test',
        userId: 'user-1',
        total: 8000,
        status: OrderStatus.PENDIENTE,
      };

      itemRepo.create.mockReturnValue(dto.items[0]);
      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);

      await service.createOrder('user-1', dto);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.created', {
        orderId: 'order-emit-test',
        userId: 'user-1',
        total: 8000,
      });
    });

    it('should process payment and transition to PAGADO when paymentData is provided and payment succeeds', async () => {
      const dto: CreateOrderDto = {
        deliveryAddress: 'Av. Principal 123',
        paymentMethod: 'tarjeta',
        total: 12000,
        items: [{ productId: 'p1', productName: 'Roll', unitPrice: 12000, quantity: 1 }],
        paymentData: { methodType: 'tarjeta', cardNumber: '4111111111111111', expiryDate: '12/27' },
      };
      const savedOrder = { id: 'o-paid', userId: 'u1', total: 12000, status: OrderStatus.PENDIENTE };

      itemRepo.create.mockReturnValue(dto.items[0]);
      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);
      mockPaymentsService.processPayment.mockResolvedValue({
        status: PaymentStatus.APROBADO,
        transactionId: 'TX-1',
      });

      await service.createOrder('u1', dto);

      expect(mockPaymentsService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'o-paid', amount: 12000, methodType: 'tarjeta' }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.paid', expect.objectContaining({ orderId: 'o-paid' }));
    });

    it('should leave order in PENDIENTE when payment fails', async () => {
      const dto: CreateOrderDto = {
        deliveryAddress: 'Calle Falsa 123',
        paymentMethod: 'tarjeta',
        total: 5000,
        items: [{ productId: 'p2', productName: 'Nigiri', unitPrice: 5000, quantity: 1 }],
        paymentData: { methodType: 'tarjeta', cardNumber: '', expiryDate: '' },
      };
      const savedOrder = { id: 'o-fail', userId: 'u2', total: 5000, status: OrderStatus.PENDIENTE };

      itemRepo.create.mockReturnValue(dto.items[0]);
      orderRepo.create.mockReturnValue(savedOrder);
      orderRepo.save.mockResolvedValue(savedOrder);
      mockPaymentsService.processPayment.mockResolvedValue({
        status: PaymentStatus.RECHAZADO,
        transactionId: 'TX-FAIL',
      });

      const result = await service.createOrder('u2', dto);

      expect(result.status).toBe(OrderStatus.PENDIENTE);
      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith('order.paid', expect.anything());
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

    it('should emit order.paid event when transitioning to PAGADO', async () => {
      const order = { id: 'o1', status: OrderStatus.PENDIENTE, userId: 'u1', total: 12000 };
      const updated = { ...order, status: OrderStatus.PAGADO };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue(updated);

      await service.updateStatus('o1', { status: OrderStatus.PAGADO }, 'admin');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.paid', {
        orderId: 'o1',
        userId: 'u1',
        amount: 12000,
      });
    });

    it('should emit order.cancelled event when transitioning to ANULADO', async () => {
      const order = { id: 'o1', status: OrderStatus.PENDIENTE, userId: 'u1', total: 5000 };
      const updated = { ...order, status: OrderStatus.ANULADO, cancelReason: 'Error en pedido' };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue(updated);

      await service.updateStatus(
        'o1',
        { status: OrderStatus.ANULADO, cancelReason: 'Error en pedido' },
        'admin',
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.cancelled', expect.objectContaining({
        orderId: 'o1',
        userId: 'u1',
        reason: 'Error en pedido',
      }));
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
