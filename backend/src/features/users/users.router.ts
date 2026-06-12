import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';

export const usersRouter = Router();

const createUserSchema = z.object({
  email: z.string().email('Невірний email'),
  name: z.string().min(2).max(100),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(['ADMIN', 'MANAGER', 'EXECUTOR']).default('EXECUTOR'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'EXECUTOR']).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users/me
usersRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, apiKey: true, createdAt: true },
  });
  res.json(user);
});

// GET /api/users/assignees — для всіх авторизованих (вибір виконавця у формі)
usersRouter.get('/assignees', authenticate, async (_req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });
  res.json({ data: users });
});

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
        select: {
          id: true, email: true, name: true, role: true,
          isActive: true, apiKey: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    res.json({ data: users, meta: buildPaginationMeta(total, page, limit) });
  }
);

// POST /api/users — Admin only (створення юзера)
usersRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate(createUserSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) throw new AppError('Email вже зареєстрований', 409, 'EMAIL_EXISTS');

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: req.body.email,
        name: req.body.name,
        passwordHash,
        role: req.body.role,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    res.status(201).json(user);
  }
);

// PATCH /api/users/:id — Admin only (редагування)
usersRouter.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validate(updateUserSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('Користувача не знайдено', 404);

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    res.json(updated);
  }
);

// DELETE /api/users/:id — Admin only
usersRouter.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    if (req.params.id === req.user!.id) {
      throw new AppError('Не можна видалити власний акаунт', 400);
    }
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('Користувача не знайдено', 404);

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }
);

// POST /api/users/:id/generate-api-key — Admin only
usersRouter.post(
  '/:id/generate-api-key',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('Користувача не знайдено', 404);

    const apiKey = uuidv4();
    await prisma.user.update({ where: { id: req.params.id }, data: { apiKey } });
    res.json({ apiKey });
  }
);
