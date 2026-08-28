import { asc, eq, like, or } from 'drizzle-orm';

import { db } from './client';
import { NewProduct, Product, products } from './schema';

export type ProductInput = Omit<NewProduct, 'id'>;

export async function addProduct(product: ProductInput): Promise<Product> {
  const [created] = await db.insert(products).values(product).returning();
  return created;
}

export async function saveProduct(product: ProductInput): Promise<Product> {
  const [saved] = await db
    .insert(products)
    .values(product)
    .onConflictDoUpdate({
      target: products.code,
      set: product,
    })
    .returning();

  return saved;
}

export async function findProductByCode(code: string): Promise<Product | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.code, code),
  });

  return product ?? null;
}

export async function findProductById(id: number): Promise<Product | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  return product ?? null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const value = `%${query.trim()}%`;

  return db
    .select()
    .from(products)
    .where(or(like(products.name, value), like(products.code, value)))
    .orderBy(asc(products.name));
}

export async function getProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(asc(products.name));
}

export async function deleteProduct(code: string): Promise<boolean> {
  const deleted = await db
    .delete(products)
    .where(eq(products.code, code))
    .returning({ id: products.id });

  return deleted.length > 0;
}
