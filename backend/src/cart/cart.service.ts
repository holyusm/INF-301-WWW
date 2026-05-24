import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddItemDto } from './dto/add-item.dto';

export interface CartWithTotal {
  cart: Cart;
  total: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
  ) {}

  calculateTotal(items: CartItem[]): number {
    return items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
  }

  async getCart(userId: string): Promise<CartWithTotal> {
    let cart = await this.cartRepo.findOne({ where: { userId } });

    if (!cart) {
      cart = this.cartRepo.create({ userId, items: [] });
      cart = await this.cartRepo.save(cart);
    }

    return { cart, total: this.calculateTotal(cart.items) };
  }

  async addItem(userId: string, dto: AddItemDto): Promise<CartWithTotal> {
    const { cart } = await this.getCart(userId);

    const existingItem = cart.items.find(
      (item) => item.productId === dto.productId,
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      await this.cartItemRepo.save(existingItem);
    } else {
      const newItem = this.cartItemRepo.create({
        productId: dto.productId,
        productName: dto.productName,
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
        cart,
      });
      await this.cartItemRepo.save(newItem);
    }

    const updatedCart = await this.cartRepo.findOne({
      where: { userId },
    });

    return {
      cart: updatedCart!,
      total: this.calculateTotal(updatedCart!.items),
    };
  }

  async updateItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartWithTotal> {
    const { cart } = await this.getCart(userId);

    const item = cart.items.find((i) => i.productId === productId);

    if (item) {
      if (quantity <= 0) {
        await this.cartItemRepo.remove(item);
      } else {
        item.quantity = quantity;
        await this.cartItemRepo.save(item);
      }
    }

    const updatedCart = await this.cartRepo.findOne({ where: { userId } });

    return {
      cart: updatedCart!,
      total: this.calculateTotal(updatedCart!.items),
    };
  }

  async removeItem(userId: string, productId: string): Promise<CartWithTotal> {
    const { cart } = await this.getCart(userId);

    const item = cart.items.find((i) => i.productId === productId);

    if (item) {
      await this.cartItemRepo.remove(item);
    }

    const updatedCart = await this.cartRepo.findOne({ where: { userId } });

    return {
      cart: updatedCart!,
      total: this.calculateTotal(updatedCart!.items),
    };
  }

  async clearCart(userId: string): Promise<CartWithTotal> {
    const { cart } = await this.getCart(userId);

    if (cart.items.length > 0) {
      await this.cartItemRepo.remove(cart.items);
    }

    const updatedCart = await this.cartRepo.findOne({ where: { userId } });

    return {
      cart: updatedCart!,
      total: 0,
    };
  }
}
