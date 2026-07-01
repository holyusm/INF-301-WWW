import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductsService } from '../products/products.service';

interface ProductSeed {
  name: string;
  description: string;
  price: number;
  categorySlug: string;
  imageUrl: string;
  featured?: boolean;
}

const PRODUCTS: ProductSeed[] = [
  {
    name: 'California Roll',
    description: 'Cangrejo, aguacate y pepino envuelto en nori y arroz, cubierto de semillas de sésamo.',
    price: 4990,
    categorySlug: 'rolls',
    imageUrl: '/images/california-roll.webp',
    featured: true,
  },
  {
    name: 'Spicy Tuna Roll',
    description: 'Atún fresco con mayonesa picante y pepino crocante, decorado con sriracha.',
    price: 5490,
    categorySlug: 'rolls',
    imageUrl: '/images/spicy-tuna-roll.webp',
  },
  {
    name: 'Dragon Roll',
    description: 'Camarón tempura cubierto con láminas de aguacate y salsa eel. Espectacular presentación.',
    price: 6490,
    categorySlug: 'rolls',
    imageUrl: '/images/dragon-roll.webp',
    featured: true,
  },
  {
    name: 'Rainbow Roll',
    description: 'California roll cubierto con variedad de pescados frescos: salmón, atún y pez limón.',
    price: 6990,
    categorySlug: 'rolls',
    imageUrl: '/images/rainbow-roll.webp',
  },
  {
    name: 'Philadelphia Roll',
    description: 'Queso crema, salmón y pepino envueltos en arroz y nori. Cremoso y refrescante.',
    price: 5290,
    categorySlug: 'rolls',
    imageUrl: '/images/philadelphia-roll.webp',
  },
  {
    name: 'Nigiri Salmón',
    description: 'Arroz prensado con lámina de salmón fresco. Servido en par.',
    price: 2490,
    categorySlug: 'nigiris',
    imageUrl: '/images/nigiri-salmon.webp',
    featured: true,
  },
  {
    name: 'Nigiri Atún',
    description: 'Arroz prensado con lámina de atún rojo fresco. Sabor intenso y profundo.',
    price: 2990,
    categorySlug: 'nigiris',
    imageUrl: '/images/nigiri-atun.webp',
  },
  {
    name: 'Nigiri Ebi',
    description: 'Arroz prensado con camarón cocido mariposa. Dulce y tierno.',
    price: 2790,
    categorySlug: 'nigiris',
    imageUrl: '/images/nigiri-ebi.webp',
  },
  {
    name: 'Nigiri Pulpo',
    description: 'Arroz prensado con pulpo cocido a la perfección. Textura única y suave.',
    price: 3190,
    categorySlug: 'nigiris',
    imageUrl: '/images/nigiri-pulpo.webp',
  },
  {
    name: 'Temaki Salmón',
    description: 'Cono de alga nori relleno de salmón fresco, arroz y aguacate cremoso.',
    price: 3990,
    categorySlug: 'temakis',
    imageUrl: '/images/temaki-salmon.webp',
  },
  {
    name: 'Temaki Camarón',
    description: 'Cono de alga nori con camarón tempura crujiente y mayonesa japonesa.',
    price: 4290,
    categorySlug: 'temakis',
    imageUrl: '/images/temaki-camaron.webp',
  },
  {
    name: 'Temaki Veggie',
    description: 'Cono de nori relleno de aguacate, pepino, zanahoria y brotes frescos. 100% vegetal.',
    price: 3490,
    categorySlug: 'temakis',
    imageUrl: '/images/temaki-veggie.webp',
  },
  {
    name: 'Combo Familiar',
    description: '3 rolls a elección + 6 nigiris + 2 temakis + miso soup. Ideal para 3-4 personas.',
    price: 21990,
    categorySlug: 'combos',
    imageUrl: '/images/combo-familiar.webp',
    featured: true,
  },
  {
    name: 'Combo Individual',
    description: '1 roll a elección + 3 nigiris + bebida. La opción perfecta para una persona.',
    price: 9490,
    categorySlug: 'combos',
    imageUrl: '/images/combo-individual.webp',
  },
  {
    name: 'Combo Pareja',
    description: '2 rolls a elección + 4 nigiris + 2 temakis + 2 bebidas. Romantico y completo.',
    price: 15990,
    categorySlug: 'combos',
    imageUrl: '/images/combo-pareja.webp',
  },
  {
    name: 'Té Verde',
    description: 'Té verde japonés premium, servido caliente o frío. Perfecto acompañamiento.',
    price: 990,
    categorySlug: 'bebidas',
    imageUrl: '/images/te-verde.webp',
  },
  {
    name: 'Agua Mineral',
    description: 'Agua mineral natural o con gas, botella 500 ml.',
    price: 790,
    categorySlug: 'bebidas',
    imageUrl: '/images/agua-mineral.webp',
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productsService = app.get(ProductsService);

  const categories = await productsService.seedCategories();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const existing = await productsService.findAll();
  if (existing.length > 0) {
    console.log(`Ya existen ${existing.length} productos, no se vuelve a sembrar.`);
    await app.close();
    return;
  }

  for (const seedProduct of PRODUCTS) {
    const category = categoryBySlug.get(seedProduct.categorySlug);
    if (!category) {
      throw new Error(`Categoría "${seedProduct.categorySlug}" no encontrada`);
    }
    await productsService.create({
      name: seedProduct.name,
      description: seedProduct.description,
      price: seedProduct.price,
      featured: seedProduct.featured ?? false,
      imageUrl: seedProduct.imageUrl,
      categoryId: category.id,
    });
  }

  console.log(`Sembrados ${PRODUCTS.length} productos en ${categories.length} categorías.`);
  await app.close();
}

seed().catch((err) => {
  console.error('Error al sembrar datos:', err);
  process.exit(1);
});
