import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSubtaskSchema, updateSubtaskSchema } from './subtasks.schema';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { createAuditLog } from '../../utils/audit';

export const subtasksRouter = Router();

// POST /api/tasks/:id/subtasks
subtasksRouter.post(
  '/:id/subtasks',
  authenticate,
  validate(createSubtaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) throw new AppError('Task not found', 404);

    const subtask = await prisma.subtask.create({
      data: {
        title: req.body.title,
        taskId: req.params.id,
        assigneeId: req.body.assigneeId,
      },
      include: { assignee: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      taskId: req.params.id,
      userId: req.user!.id,
      action: 'SUBTASK_CREATED',
      newValue: { subtaskId: subtask.id, title: subtask.title },
    });

    res.status(201).json(subtask);
  }
);

// PATCH /api/tasks/:id/subtasks/:subId
subtasksRouter.patch(
  '/:id/subtasks/:subId',
  authenticate,
  validate(updateSubtaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const subtask = await prisma.subtask.findFirst({
      where: { id: req.params.subId, taskId: req.params.id },
    });
    if (!subtask) throw new AppError('Subtask not found', 404);

    const updated = await prisma.subtask.update({
      where: { id: req.params.subId },
      data: {
        ...(req.body.title !== undefined && { title: req.body.title }),
        ...(req.body.status !== undefined && { status: req.body.status }),
        ...(req.body.assigneeId !== undefined && { assigneeId: req.body.assigneeId }),
      },
      include: { assignee: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      taskId: req.params.id,
      userId: req.user!.id,
      action: 'SUBTASK_UPDATED',
      oldValue: { status: subtask.status, title: subtask.title },
      newValue: { status: updated.status, title: updated.title },
    });

    res.json(updated);
  }
);

// DELETE /api/tasks/:id/subtasks/:subId
subtasksRouter.delete(
  '/:id/subtasks/:subId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const subtask = await prisma.subtask.findFirst({
      where: { id: req.params.subId, taskId: req.params.id },
    });
    if (!subtask) throw new AppError('Subtask not found', 404);

    await prisma.subtask.delete({ where: { id: req.params.subId } });

    await createAuditLog({
      taskId: req.params.id,
      userId: req.user!.id,
      action: 'SUBTASK_DELETED',
      oldValue: { subtaskId: req.params.subId, title: subtask.title },
    });

    res.status(204).send();
  }
);
