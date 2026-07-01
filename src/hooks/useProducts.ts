import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { mapProduct } from '../api/mappers';
import type { Product } from '../types';

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiProducts = await api.products.list();
      setProducts(apiProducts.map(mapProduct));
      setCategories(
        Array.from(
          new Map(apiProducts.map((p) => [p.category.id, p.category])).values()
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el menú.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { products, categories, loading, error, refetch };
}
