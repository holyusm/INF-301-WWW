import type { CartItem, Order, Product } from '../types';
import type { ApiCartItem, ApiOrder, ApiOrderItem, ApiProduct } from './client';

export function mapProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    category: p.category.slug,
    categoryName: p.category.name,
    image: p.imageUrl ?? '',
    available: p.available,
    featured: p.featured,
  };
}

export function mapLineItem(item: ApiCartItem | ApiOrderItem): CartItem {
  return {
    productId: item.productId,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
  };
}

export function mapOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    userId: o.userId,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    items: o.items.map(mapLineItem),
    total: Number(o.total),
    status: o.status,
    createdAt: o.createdAt,
    address: o.deliveryAddress,
    paymentMethod: o.paymentMethod,
    cancelReason: o.cancelReason ?? undefined,
  };
}
