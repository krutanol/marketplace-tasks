import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Невірний формат дати' }).optional(),
  assigneeId: z.string().uuid().optional(),
  // Articles: array of article strings, or "ALL" to target all products
  articles: z
    .union([z.array(z.string().min(1)).min(1), z.literal('ALL')])
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'Невірний формат дати' }).optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export const listTasksQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().uuid().optional(),
  article: z.string().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
});

export const updateArticleStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
