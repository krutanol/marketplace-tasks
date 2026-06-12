import { z } from 'zod';

export const createProductSchema = z.object({
  article: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
});

export const importProductsSchema = z.object({
  products: z.array(createProductSchema).min(1).max(1000),
});

export const listProductsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ImportProductsInput = z.infer<typeof importProductsSchema>;
