import { api } from '../../lib/api';
import type { Task, PaginatedResponse } from '../../types';

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigneeId?: string;
  article?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export const tasksApi = {
  list: (filters: TaskFilters = {}) =>
    api.get<PaginatedResponse<Task>>('/tasks', { params: filters }).then((r) => r.data),

  getById: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  getByArticle: (article: string) =>
    api.get<{ data: Task[] }>(`/tasks/by-article/${article}`).then((r) => r.data),

  create: (data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    assigneeId?: string;
    articles?: string[] | 'ALL';
  }) => api.post<Task>('/tasks', data).then((r) => r.data),

  update: (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      assigneeId?: string | null;
    }
  ) => api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/tasks/${id}`),

  updateArticleStatus: (taskId: string, article: string, status: string) =>
    api.patch(`/tasks/${taskId}/articles/${article}/status`, { status }).then((r) => r.data),

  // Subtasks
  createSubtask: (taskId: string, data: { title: string; assigneeId?: string }) =>
    api.post(`/tasks/${taskId}/subtasks`, data).then((r) => r.data),

  updateSubtask: (
    taskId: string,
    subId: string,
    data: { title?: string; status?: string; assigneeId?: string | null }
  ) => api.patch(`/tasks/${taskId}/subtasks/${subId}`, data).then((r) => r.data),

  deleteSubtask: (taskId: string, subId: string) =>
    api.delete(`/tasks/${taskId}/subtasks/${subId}`),
};
