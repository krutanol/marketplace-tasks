import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';

export const usersRouter = Router();

// GET /api/users/me
usersRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, apiKey: true, createdAt: true },
  });
  res.json(user);
});

// GET /api/users/assignees — для всіх авторизованих (для вибору виконавця у формі)
usersRouter.get(
  '/assignees',
  authenticate,
  async (_req: AuthenticatedRequest, res: Response) => {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ data: users });
  }
);

// GET /api/users — Admin only
usersRouter.get(
  '/',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    res.json({ data: users, meta: buildPaginationMeta(total, page, limit) });
  }
);

// POST /api/users/:id/generate-api-key — Admin only
usersRouter.post(
  '/:id/generate-api-key',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('User not found', 404);

    const apiKey = uuidv4();
    await prisma.user.update({ where: { id: req.params.id }, data: { apiKey } });
    res.json({ apiKey });
  }
);

// PATCH /api/users/:id/deactivate — Admin only
usersRouter.patch(
  '/:id/deactivate',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'User deactivated' });
  }
);
