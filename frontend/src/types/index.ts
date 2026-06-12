export type Role = 'ADMIN' | 'MANAGER' | 'EXECUTOR';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Frequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type SubtaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type ArticleTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  apiKey?: string;
  isActive?: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  article: string;
  name: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: SubtaskStatus;
  taskId: string;
  assigneeId?: string;
  assignee?: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskArticle {
  id: string;
  taskId: string;
  productId: string;
  status: ArticleTaskStatus;
  product: Pick<Product, 'article' | 'name'>;
}

export interface AuditLog {
  id: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
  user: Pick<User, 'id' | 'name'>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  frequency: Frequency;
  repeatUntil?: string;
  dueDate?: string;
  creatorId: string;
  assigneeId?: string;
  creator: Pick<User, 'id' | 'name'>;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  subtasks: Subtask[];
  taskArticles: TaskArticle[];
  auditLogs?: AuditLog[];
  _count?: { subtasks: number; taskArticles: number };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
