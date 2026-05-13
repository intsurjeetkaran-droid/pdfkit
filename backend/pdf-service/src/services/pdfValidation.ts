import { z } from 'zod';

export const splitSchema = z.object({
  pages: z.array(z.number().int().positive()).min(1, 'At least one page number is required')
});

export const rotateSchema = z.object({
  pages: z.array(z.number().int().positive()).default([]),
  angle: z.union([z.literal(90), z.literal(180), z.literal(270)])
});

export const extractSchema = z.object({
  fromPage: z.number().int().positive(),
  toPage: z.number().int().positive()
});

export const deletePagesSchema = z.object({
  pages: z.array(z.number().int().positive()).min(1, 'At least one page number is required')
});

export const reorderSchema = z.object({
  order: z.array(z.number().int().positive()).min(1, 'At least one page number is required')
});

export const watermarkSchema = z.object({
  text: z.string().min(1).max(200).optional(),
  opacity: z.number().min(0).max(1).optional(),
  rotation: z.number().min(0).max(360).optional(),
  pages: z.array(z.number().int().positive()).optional(),
  fontSize: z.number().int().min(8).max(200).optional()
});
