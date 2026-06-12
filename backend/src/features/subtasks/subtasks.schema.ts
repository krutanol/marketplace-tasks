import { z } from 'zod';

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
  assigneeId: z.string().uuid().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
