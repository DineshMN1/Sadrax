import { z } from "zod";

export const variantSchema = z.object({
  unit: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  mrp: z.number().int().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  image: z.string().nullable().optional(),
}).strict();

export const baseProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  price: z.number().int().nonnegative().optional(),
  mrp: z.number().int().nonnegative().nullable().optional(),
  unit: z.string().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.number().nullable().optional(),
  images: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  brand: z.string().nullable().optional(),
  veg: z.enum(["veg", "nonveg"]).nullable().optional(),
  variantGroup: z.string().nullable().optional(),
  variants: z.array(variantSchema).optional(),
}).strict();

export const createProductSchema = baseProductSchema.extend({
  name: z.string().min(1),
}).strict();

export const updateProductSchema = baseProductSchema.partial().strict();
