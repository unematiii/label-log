import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),

  basisAmount: real('basis_amount').notNull(),
  basisUnit: text('basis_unit', { enum: ['g', 'ml', 'serving'] }).notNull(),

  servingAmount: real('serving_amount').notNull(),
  servingUnit: text('serving_unit', { enum: ['g', 'ml'] }).notNull(),

  energyKj: real('energy_kj').notNull(),
  energyKcal: real('energy_kcal').notNull(),

  fatG: real('fat_g').notNull(),
  saturatedFatG: real('saturated_fat_g').notNull(),
  carbohydratesG: real('carbohydrates_g').notNull(),
  sugarsG: real('sugars_g').notNull(),
  fibreG: real('fibre_g').notNull(),
  proteinG: real('protein_g').notNull(),
  saltG: real('salt_g').notNull(),
  sodiumMg: real('sodium_mg').notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
