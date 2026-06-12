import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error.middleware';
import { createAuditLog } from '../../utils/audit';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from './tasks.schema';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination';

export async function listTasks(query: ListTasksQuery) {
  const { page, limit, skip } = getPaginationParams(query);

  const where: Record<string, unknown> = {};

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assigneeId) where.assigneeId = query.assigneeId;

  if (query.article) {
    where.taskArticles = {
      some: { product: { article: query.article } },
    };
  }

  if (query.dueBefore || query.dueAfter) {
    where.dueDate = {
      ...(query.dueBefore ? { lte: new Date(query.dueBefore) } : {}),
      ...(query.dueAfter ? { gte: new Date(query.dueAfter) } : {}),
    };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { subtasks: true, taskArticles: true } },
        subtasks: { select: { id: true, status: true } },
        taskArticles: {
          include: { product: { select: { article: true, name: true } } },
        },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { data: tasks, meta: buildPaginationMeta(total, page, limit) };
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      subtasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      taskArticles: {
        include: { product: { select: { article: true, name: true } } },
        orderBy: { product: { article: 'asc' } },
      },
      auditLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function createTask(input: CreateTaskInput, creatorId: string) {
  let productIds: string[] = [];

  if (input.articles === 'ALL') {
    const products = await prisma.product.findMany({ select: { id: true } });
    productIds = products.map((p) => p.id);
  } else if (Array.isArray(input.articles) && input.articles.length > 0) {
    const products = await prisma.product.findMany({
      where: { article: { in: input.articles } },
      select: { id: true, article: true },
    });

    const foundArticles = products.map((p) => p.article);
    const notFound = input.articles.filter((a) => !foundArticles.includes(a));
    if (notFound.length > 0) {
      throw new AppError(`Articles not found: ${notFound.join(', ')}`, 404, 'ARTICLES_NOT_FOUND');
    }

    productIds = products.map((p) => p.id);
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      assigneeId: input.assigneeId,
      creatorId,
      taskArticles:
        productIds.length > 0
          ? { create: productIds.map((productId) => ({ productId })) }
          : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      taskArticles: {
        include: { product: { select: { article: true, name: true } } },
      },
    },
  });

  await createAuditLog({
    taskId: task.id,
    userId: creatorId,
    action: 'TASK_CREATED',
    newValue: { title: task.title, status: task.status, priority: task.priority },
  });

  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput, userId: string) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new AppError('Task not found', 404);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
      ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      subtasks: true,
      taskArticles: {
        include: { product: { select: { article: true, name: true } } },
      },
    },
  });

  await createAuditLog({
    taskId: id,
    userId,
    action: 'TASK_UPDATED',
    oldValue: {
      title: existing.title,
      status: existing.status,
      priority: existing.priority,
      assigneeId: existing.assigneeId,
    },
    newValue: {
      title: updated.title,
      status: updated.status,
      priority: updated.priority,
      assigneeId: updated.assigneeId,
    },
  });

  return updated;
}

export async function deleteTask(id: string) {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new AppError('Task not found', 404);
  await prisma.task.delete({ where: { id } });
}

export async function getTasksByArticle(article: string) {
  const product = await prisma.product.findUnique({ where: { article } });
  if (!product) throw new AppError('Product not found', 404);

  const tasks = await prisma.task.findMany({
    where: { taskArticles: { some: { productId: product.id } } },
    include: {
      assignee: { select: { id: true, name: true } },
      taskArticles: {
        where: { productId: product.id },
        select: { status: true },
      },
      _count: { select: { subtasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks;
}

export async function updateArticleTaskStatus(
  taskId: string,
  article: string,
  status: string,
  userId: string
) {
  const product = await prisma.product.findUnique({ where: { article } });
  if (!product) throw new AppError('Product not found', 404);

  const taskArticle = await prisma.taskArticle.findUnique({
    where: { taskId_productId: { taskId, productId: product.id } },
  });
  if (!taskArticle) throw new AppError('This task is not associated with this article', 404);

  const updated = await prisma.taskArticle.update({
    where: { taskId_productId: { taskId, productId: product.id } },
    data: { status: status as 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' },
    include: { product: { select: { article: true, name: true } } },
  });

  await createAuditLog({
    taskId,
    userId,
    action: 'ARTICLE_STATUS_UPDATED',
    oldValue: { article, status: taskArticle.status },
    newValue: { article, status },
  });

  return updated;
}
