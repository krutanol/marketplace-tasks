import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  updateArticleStatusSchema,
} from './tasks.schema';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByArticle,
  updateArticleTaskStatus,
} from './tasks.service';

export const tasksRouter = Router();

// GET /api/tasks
tasksRouter.get(
  '/',
  authenticate,
  validateQuery(listTasksQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await listTasks(req.query as never, req.user!.id, req.user!.role);
    res.json(result);
  }
);

// GET /api/tasks/by-article/:article
tasksRouter.get(
  '/by-article/:article',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const tasks = await getTasksByArticle(req.params.article, req.user!.id, req.user!.role);
    res.json({ data: tasks });
  }
);

// GET /api/tasks/:id
tasksRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const task = await getTaskById(req.params.id, req.user!.id, req.user!.role);
  res.json(task);
});

// POST /api/tasks — Manager/Admin
tasksRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  validate(createTaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const task = await createTask(req.body, req.user!.id);
    res.status(201).json(task);
  }
);

// PATCH /api/tasks/:id
tasksRouter.patch(
  '/:id',
  authenticate,
  validate(updateTaskSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const task = await updateTask(req.params.id, req.body, req.user!.id);
    res.json(task);
  }
);

// DELETE /api/tasks/:id — Admin/Manager
tasksRouter.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  async (req: AuthenticatedRequest, res: Response) => {
    await deleteTask(req.params.id);
    res.status(204).send();
  }
);

// PATCH /api/tasks/:id/articles/:article/status
tasksRouter.patch(
  '/:id/articles/:article/status',
  authenticate,
  validate(updateArticleStatusSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const updated = await updateArticleTaskStatus(
      req.params.id,
      req.params.article,
      req.body.status,
      req.user!.id
    );
    res.json(updated);
  }
);
