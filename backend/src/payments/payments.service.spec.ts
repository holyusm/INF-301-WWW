import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { CreditCardPayment } from './strategies/credit-card.payment';
import { ServipagPayment } from './strategies/servipag.payment';
import { BankTransferPayment } from './strategies/bank-transfer.payment';

const mockPaymentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

// ---------------------------------------------------------------------------
// Concrete strategy unit tests
// ---------------------------------------------------------------------------
describe('CreditCardPayment', () => {
  it('should have type "tarjeta"', () => {
    const cc = new CreditCardPayment('4111****1111', '12/26');
    expect(cc.type).toBe('tarjeta');
  });

  it('validate() returns true when both fields are present', () => {
    const cc = new CreditCardPayment('4111****1111', '12/26');
    expect(cc.validate()).toBe(true);
  });

  it('validate() returns false when a field is missing', () => {
    const cc = new CreditCardPayment('', '12/26');
    expect(cc.validate()).toBe(false);
  });

  it('process() returns a successful PaymentResult with CC- prefix', async () => {
    const cc = new CreditCardPayment('4111****1111', '12/26');
    const result = await cc.process(5000);
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^CC-/);
    expect(result.message).toContain('5000');
  });
});

describe('ServipagPayment', () => {
  it('should have type "servipag"', () => {
    const sp = new ServipagPayment('1234****5678', '08/25');
    expect(sp.type).toBe('servipag');
  });

  it('validate() returns true when both fields are present', () => {
    const sp = new ServipagPayment('1234****5678', '08/25');
    expect(sp.validate()).toBe(true);
  });

  it('validate() returns false when a field is missing', () => {
    const sp = new ServipagPayment('1234****5678', '');
    expect(sp.validate()).toBe(false);
  });

  it('process() returns a successful PaymentResult with SP- prefix', async () => {
    const sp = new ServipagPayment('1234****5678', '08/25');
    const result = await sp.process(3000);
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^SP-/);
    expect(result.message).toContain('3000');
  });
});

describe('BankTransferPayment', () => {
  it('should have type "transferencia"', () => {
    const bt = new BankTransferPayment('Banco Estado', '123456789');
    expect(bt.type).toBe('transferencia');
  });

  it('validate() returns true when both fields are present', () => {
    const bt = new BankTransferPayment('Banco Estado', '123456789');
    expect(bt.validate()).toBe(true);
  });

  it('validate() returns false when bankName is empty', () => {
    const bt = new BankTransferPayment('', '123456789');
    expect(bt.validate()).toBe(false);
  });

  it('process() returns a successful PaymentResult with BT- prefix', async () => {
    const bt = new BankTransferPayment('Banco Estado', '123456789');
    const result = await bt.process(8000);
    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^BT-/);
    expect(result.message).toContain('8000');
  });
});

// ---------------------------------------------------------------------------
// PaymentsService unit tests
// ---------------------------------------------------------------------------
describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: ReturnType<typeof mockPaymentRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useFactory: mockPaymentRepo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get(getRepositoryToken(Payment));
  });

  // -----------------------------------------------------------------------
  // buildPaymentMethod
  // -----------------------------------------------------------------------
  describe('buildPaymentMethod', () => {
    it('returns CreditCardPayment for methodType "tarjeta"', () => {
      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: 5000,
        methodType: 'tarjeta',
        cardNumber: '4111****1111',
        expiryDate: '12/26',
      };
      const method = service.buildPaymentMethod(dto);
      expect(method).toBeInstanceOf(CreditCardPayment);
      expect(method.type).toBe('tarjeta');
    });

    it('returns ServipagPayment for methodType "servipag"', () => {
      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: 3000,
        methodType: 'servipag',
        cardNumber: '1234****5678',
        expiryDate: '08/25',
      };
      const method = service.buildPaymentMethod(dto);
      expect(method).toBeInstanceOf(ServipagPayment);
      expect(method.type).toBe('servipag');
    });

    it('returns BankTransferPayment for methodType "transferencia"', () => {
      const dto: ProcessPaymentDto = {
        orderId: 'order-1',
        amount: 8000,
        methodType: 'transferencia',
        bankName: 'Banco Estado',
        accountNumber: '123456789',
      };
      const method = service.buildPaymentMethod(dto);
      expect(method).toBeInstanceOf(BankTransferPayment);
      expect(method.type).toBe('transferencia');
    });

    it('throws BadRequestException for an unknown methodType', () => {
      const dto = {
        orderId: 'order-1',
        amount: 1000,
        methodType: 'bitcoin',
      } as unknown as ProcessPaymentDto;

      expect(() => service.buildPaymentMethod(dto)).toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------------------
  // processPayment
  // -----------------------------------------------------------------------
  describe('processPayment', () => {
    it('should save a Payment with APROBADO status on successful processing', async () => {
      const dto: ProcessPaymentDto = {
        orderId: 'order-uuid',
        amount: 7500,
        methodType: 'tarjeta',
        cardNumber: '4111****1111',
        expiryDate: '12/26',
      };

      const createdPayment = {
        orderId: dto.orderId,
        amount: dto.amount,
        methodType: dto.methodType,
        status: PaymentStatus.APROBADO,
        transactionId: 'CC-123',
        errorMessage: null,
      };
      const savedPayment = { id: 'pay-uuid', ...createdPayment };

      paymentRepo.create.mockReturnValue(createdPayment);
      paymentRepo.save.mockResolvedValue(savedPayment);

      const result = await service.processPayment(dto);

      expect(paymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PaymentStatus.APROBADO }),
      );
      expect(result).toEqual(savedPayment);
    });

    it('should throw BadRequestException when validate() fails', async () => {
      const dto: ProcessPaymentDto = {
        orderId: 'order-uuid',
        amount: 7500,
        methodType: 'tarjeta',
        cardNumber: '',   // empty -> validate() = false
        expiryDate: '',
      };

      await expect(service.processPayment(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(paymentRepo.save).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getByOrderId
  // -----------------------------------------------------------------------
  describe('getByOrderId', () => {
    it('should return the payment when found', async () => {
      const payment = { id: 'pay-1', orderId: 'order-1' };
      paymentRepo.findOne.mockResolvedValue(payment);

      const result = await service.getByOrderId('order-1');
      expect(result).toEqual(payment);
    });

    it('should throw NotFoundException when no payment exists for the orderId', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.getByOrderId('missing-order')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
