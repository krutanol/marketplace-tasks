import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from './tasks.api';
import { SubtaskList } from '../subtasks/SubtaskList';
import { ArticleStatusList } from './ArticleStatusList';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../users/auth.store';
import type { TaskStatus, Priority } from '../../types';
import { cn } from '../../lib/cn';

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'До виконання',
  IN_PROGRESS: 'В роботі',
  DONE: 'Готово',
  CANCELLED: 'Скасовано',
};

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const priorityLabels: Record<Priority, string> = {
  LOW: 'Низький',
  MEDIUM: 'Середній',
  HIGH: 'Високий',
};

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id!),
    enabled: !!id,
  });

  const updateTask = useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[1]) =>
      tasksApi.update(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Завантаження...</div>;
  if (!task) return <div className="p-8 text-red-500">Задачу не знайдено</div>;

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/board')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Назад до дошки
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Title */}
        <div className="mb-4">
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => {
                if (titleValue.trim() && titleValue !== task.title) {
                  updateTask.mutate({ title: titleValue.trim() });
                }
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              className="text-2xl font-bold text-gray-900 w-full border-b-2 border-primary-500 outline-none"
            />
          ) : (
            <h1
              className={cn('text-2xl font-bold text-gray-900', canEdit && 'cursor-pointer hover:text-primary-600 transition-colors')}
              onClick={() => {
                if (canEdit) {
                  setTitleValue(task.title);
                  setEditingTitle(true);
                }
              }}
            >
              {task.title}
            </h1>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 mb-6 text-sm">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Статус:</span>
            <select
              value={task.status}
              onChange={(e) => updateTask.mutate({ status: e.target.value as TaskStatus })}
              className={cn('px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer', statusColors[task.status])}
            >
              {(Object.keys(statusLabels) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Пріоритет:</span>
            {canEdit ? (
              <select
                value={task.priority}
                onChange={(e) => updateTask.mutate({ priority: e.target.value as Priority })}
                className="text-xs border border-gray-200 rounded px-2 py-0.5"
              >
                {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                  <option key={p} value={p}>{priorityLabels[p]}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium">{priorityLabels[task.priority]}</span>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-1 text-gray-600">
            <User size={14} />
            {task.assignee?.name ?? 'Не призначено'}
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar size={14} />
              {format(new Date(task.dueDate), 'd MMMM yyyy', { locale: uk })}
            </div>
          )}

          {/* Created */}
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock size={12} />
            Створено {format(new Date(task.createdAt), 'd MMM yyyy', { locale: uk })}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Опис</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Subtasks */}
        <div className="mb-6">
          <SubtaskList taskId={task.id} subtasks={task.subtasks} />
        </div>

        {/* Article statuses */}
        {task.taskArticles.length > 0 && (
          <div className="mb-6">
            <ArticleStatusList taskId={task.id} articles={task.taskArticles} />
          </div>
        )}

        {/* Audit log */}
        {task.auditLogs && task.auditLogs.length > 0 && (
          <AuditLogSection logs={task.auditLogs} />
        )}
      </div>
    </div>
  );
}

function AuditLogSection({ logs }: { logs: NonNullable<ReturnType<typeof Object.values>[0]>[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
      >
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
        Історія змін ({(logs as unknown[]).length})
      </button>
      {open && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {(logs as Array<{ id: string; action: string; createdAt: string; user: { name: string } }>).map((log) => (
            <div key={log.id} className="text-xs text-gray-500 flex gap-2">
              <span className="text-gray-400">
                {format(new Date(log.createdAt), 'dd.MM.yy HH:mm')}
              </span>
              <span className="font-medium text-gray-600">{log.user.name}</span>
              <span>{log.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
