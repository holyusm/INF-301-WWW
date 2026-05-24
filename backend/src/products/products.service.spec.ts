import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';

const mockCategory: Category = {
  id: 'cat-uuid-1',
  name: 'Rolls',
  slug: 'rolls',
  products: [],
};

const mockProduct: Product = {
  id: 'prod-uuid-1',
  name: 'Dragon Roll',
  description: 'Roll de salmón y palta',
  price: 9990,
  available: true,
  featured: false,
  imageUrl: null,
  category: mockCategory,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockProductRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockCategoryRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: ReturnType<typeof mockProductRepository>;
  let categoryRepo: ReturnType<typeof mockCategoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useFactory: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useFactory: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  describe('findAll', () => {
    it('should return all products when no categorySlug is provided', async () => {
      productRepo.find.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(productRepo.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockProduct]);
    });

    it('should filter products by categorySlug when provided', async () => {
      const qbMock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct]),
      };
      productRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.findAll('rolls');

      expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(qbMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'product.category',
        'category',
      );
      expect(qbMock.where).toHaveBeenCalledWith('category.slug = :slug', {
        slug: 'rolls',
      });
      expect(qbMock.getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      productRepo.findOne.mockResolvedValue(mockProduct);

      const result = await service.findById('prod-uuid-1');

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'prod-uuid-1' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new product', async () => {
      categoryRepo.findOne.mockResolvedValue(mockCategory);
      productRepo.create.mockReturnValue(mockProduct);
      productRepo.save.mockResolvedValue(mockProduct);

      const dto = {
        name: 'Dragon Roll',
        description: 'Roll de salmón y palta',
        price: 9990,
        categoryId: 'cat-uuid-1',
      };

      const result = await service.create(dto);

      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-uuid-1' },
      });
      expect(productRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        available: true,
        featured: false,
        imageUrl: undefined,
        category: mockCategory,
      });
      expect(productRepo.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when category is not found', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Test',
          description: 'Desc',
          price: 1000,
          categoryId: 'invalid-cat-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setAvailability', () => {
    it('should update and return the product with new availability', async () => {
      const updatedProduct = { ...mockProduct, available: false };
      productRepo.findOne.mockResolvedValue({ ...mockProduct });
      productRepo.save.mockResolvedValue(updatedProduct);

      const result = await service.setAvailability('prod-uuid-1', false);

      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ available: false }),
      );
      expect(result.available).toBe(false);
    });

    it('should throw NotFoundException when product is not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.setAvailability('nonexistent-id', true),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
