import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const SEED_CATEGORIES = [
  { name: 'Rolls', slug: 'rolls' },
  { name: 'Nigiris', slug: 'nigiris' },
  { name: 'Temakis', slug: 'temakis' },
  { name: 'Combos', slug: 'combos' },
  { name: 'Bebidas', slug: 'bebidas' },
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(categorySlug?: string): Promise<Product[]> {
    if (!categorySlug) {
      return this.productRepo.find();
    }

    return this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('category.slug = :slug', { slug: categorySlug })
      .getMany();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría con id "${dto.categoryId}" no encontrada`,
      );
    }

    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      available: dto.available ?? true,
      featured: dto.featured ?? false,
      imageUrl: dto.imageUrl,
      category,
    });

    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Categoría con id "${dto.categoryId}" no encontrada`,
        );
      }

      product.category = category;
    }

    const { categoryId: _categoryId, ...rest } = dto;
    Object.assign(product, rest);

    return this.productRepo.save(product);
  }

  async setAvailability(id: string, available: boolean): Promise<Product> {
    const product = await this.findById(id);
    product.available = available;
    return this.productRepo.save(product);
  }

  async seedCategories(): Promise<Category[]> {
    const results: Category[] = [];

    for (const seed of SEED_CATEGORIES) {
      const existing = await this.categoryRepo.findOne({
        where: { slug: seed.slug },
      });

      if (!existing) {
        const created = this.categoryRepo.create(seed);
        results.push(await this.categoryRepo.save(created));
      } else {
        results.push(existing);
      }
    }

    return results;
  }
}
