import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import {
  createProductSchema,
  importProductsSchema,
  listProductsQuerySchema,
} from './products.schema';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';

export const productsRouter = Router();

// GET /api/products
productsRouter.get(
  '/',
  authenticate,
  validateQuery(listProductsQuerySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const search = req.query.search as string | undefined;

    const where = search
      ? {
          OR: [
            { article: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { article: 'asc' } }),
      prisma.product.count({ where }),
    ]);

    res.json({ data: products, meta: buildPaginationMeta(total, page, limit) });
  }
);

// POST /api/products — Admin/Manager
productsRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  validate(createProductSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const existing = await prisma.product.findUnique({ where: { article: req.body.article } });
    if (existing) throw new AppError('Article already exists', 409, 'ARTICLE_EXISTS');

    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  }
);

// POST /api/products/import — Admin/Manager (bulk import)
productsRouter.post(
  '/import',
  authenticate,
  requireRole('ADMIN', 'MANAGER'),
  validate(importProductsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { products } = req.body;

    // Upsert all products
    const results = await Promise.allSettled(
      products.map((p: { article: string; name: string }) =>
        prisma.product.upsert({
          where: { article: p.article },
          update: { name: p.name },
          create: p,
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.status(201).json({ imported: succeeded, failed, total: products.length });
  }
);

// GET /api/products/:article
productsRouter.get('/:article', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { article: req.params.article },
    include: {
      taskArticles: {
        include: { task: { select: { id: true, title: true, status: true, priority: true } } },
      },
    },
  });
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
});

// DELETE /api/products/:article — Admin only
productsRouter.delete(
  '/:article',
  authenticate,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    const product = await prisma.product.findUnique({ where: { article: req.params.article } });
    if (!product) throw new AppError('Product not found', 404);

    await prisma.product.delete({ where: { article: req.params.article } });
    res.status(204).send();
  }
);
