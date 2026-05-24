import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

const mockCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'item-uuid-1',
  productId: 'prod-uuid-1',
  productName: 'Dragon Roll',
  unitPrice: 9990,
  quantity: 2,
  cart: null as any,
  ...overrides,
});

const mockCart = (overrides: Partial<Cart> = {}): Cart => ({
  id: 'cart-uuid-1',
  userId: 'user-uuid-1',
  items: [],
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const mockCartRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockCartItemRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('CartService', () => {
  let service: CartService;
  let cartRepo: ReturnType<typeof mockCartRepository>;
  let cartItemRepo: ReturnType<typeof mockCartItemRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useFactory: mockCartRepository,
        },
        {
          provide: getRepositoryToken(CartItem),
          useFactory: mockCartItemRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepo = module.get(getRepositoryToken(Cart));
    cartItemRepo = module.get(getRepositoryToken(CartItem));
  });

  describe('calculateTotal', () => {
    it('should return 0 for empty items', () => {
      expect(service.calculateTotal([])).toBe(0);
    });

    it('should calculate the sum of unitPrice * quantity for each item', () => {
      const items = [
        mockCartItem({ unitPrice: 9990, quantity: 2 }),
        mockCartItem({
          id: 'item-uuid-2',
          productId: 'prod-uuid-2',
          unitPrice: 4990,
          quantity: 1,
        }),
      ];

      expect(service.calculateTotal(items)).toBe(9990 * 2 + 4990 * 1);
    });
  });

  describe('getCart', () => {
    it('should return existing cart when found', async () => {
      const cart = mockCart({ items: [mockCartItem()] });
      cartRepo.findOne.mockResolvedValue(cart);

      const result = await service.getCart('user-uuid-1');

      expect(cartRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
      });
      expect(result.cart).toEqual(cart);
      expect(result.total).toBe(9990 * 2);
    });

    it('should create and return a new cart when not found', async () => {
      const newCart = mockCart({ items: [] });
      cartRepo.findOne.mockResolvedValue(null);
      cartRepo.create.mockReturnValue(newCart);
      cartRepo.save.mockResolvedValue(newCart);

      const result = await service.getCart('user-uuid-1');

      expect(cartRepo.create).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        items: [],
      });
      expect(cartRepo.save).toHaveBeenCalledWith(newCart);
      expect(result.cart).toEqual(newCart);
      expect(result.total).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add a new item to the cart', async () => {
      const cart = mockCart({ items: [] });
      const updatedCart = mockCart({ items: [mockCartItem()] });
      cartRepo.findOne
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);
      cartItemRepo.create.mockReturnValue(mockCartItem());
      cartItemRepo.save.mockResolvedValue(mockCartItem());

      const dto = {
        productId: 'prod-uuid-1',
        productName: 'Dragon Roll',
        unitPrice: 9990,
        quantity: 2,
      };

      const result = await service.addItem('user-uuid-1', dto);

      expect(cartItemRepo.create).toHaveBeenCalledWith({
        productId: dto.productId,
        productName: dto.productName,
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
        cart,
      });
      expect(cartItemRepo.save).toHaveBeenCalledTimes(1);
      expect(result.cart).toEqual(updatedCart);
    });

    it('should sum quantity when item with same productId already exists', async () => {
      const existingItem = mockCartItem({ quantity: 1 });
      const cart = mockCart({ items: [existingItem] });
      const updatedCart = mockCart({
        items: [mockCartItem({ quantity: 3 })],
      });
      cartRepo.findOne
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);
      cartItemRepo.save.mockResolvedValue({ ...existingItem, quantity: 3 });

      const dto = {
        productId: 'prod-uuid-1',
        productName: 'Dragon Roll',
        unitPrice: 9990,
        quantity: 2,
      };

      const result = await service.addItem('user-uuid-1', dto);

      expect(cartItemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 3 }),
      );
      expect(result.cart).toEqual(updatedCart);
    });
  });

  describe('updateItem', () => {
    it('should update the quantity of an existing item', async () => {
      const item = mockCartItem({ quantity: 1 });
      const cart = mockCart({ items: [item] });
      const updatedCart = mockCart({ items: [mockCartItem({ quantity: 5 })] });
      cartRepo.findOne
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);
      cartItemRepo.save.mockResolvedValue({ ...item, quantity: 5 });

      const result = await service.updateItem('user-uuid-1', 'prod-uuid-1', 5);

      expect(cartItemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
      expect(result.cart).toEqual(updatedCart);
    });

    it('should remove the item when quantity is 0 or less', async () => {
      const item = mockCartItem({ quantity: 2 });
      const cart = mockCart({ items: [item] });
      const emptyCart = mockCart({ items: [] });
      cartRepo.findOne
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(emptyCart);
      cartItemRepo.remove.mockResolvedValue(item);

      await service.updateItem('user-uuid-1', 'prod-uuid-1', 0);

      expect(cartItemRepo.remove).toHaveBeenCalledWith(item);
    });
  });

  describe('removeItem', () => {
    it('should remove the specified item from the cart', async () => {
      const item = mockCartItem();
      const cart = mockCart({ items: [item] });
      const emptyCart = mockCart({ items: [] });
      cartRepo.findOne
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(emptyCart);
      cartItemRepo.remove.mockResolvedValue(item);

      const result = await service.removeItem('user-uuid-1', 'prod-uuid-1');

      expect(cartItemRepo.remove).toHaveBeenCalledWith(item);
      expect(result.cart).toEqual(emptyCart);
      expect(result.total).toBe(0);
    });

    it('should do nothing when productId is not in cart', async () => {
      const cart = mockCart({ items: [] });
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cart);

      await service.removeItem('user-uuid-1', 'nonexistent-prod');

      expect(cartItemRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should remove all items from the cart', async () => {
      const items = [
        mockCartItem(),
        mockCartItem({ id: 'item-uuid-2', productId: 'prod-uuid-2' }),
      ];
      const cart = mockCart({ items });
      const emptyCart = mockCart({ items: [] });
      cartRepo.findOne
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(emptyCart);
      cartItemRepo.remove.mockResolvedValue(items);

      const result = await service.clearCart('user-uuid-1');

      expect(cartItemRepo.remove).toHaveBeenCalledWith(items);
      expect(result.total).toBe(0);
      expect(result.cart).toEqual(emptyCart);
    });

    it('should not call remove when cart is already empty', async () => {
      const cart = mockCart({ items: [] });
      cartRepo.findOne.mockResolvedValueOnce(cart).mockResolvedValueOnce(cart);

      await service.clearCart('user-uuid-1');

      expect(cartItemRepo.remove).not.toHaveBeenCalled();
    });
  });
});
