import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tasksApi } from './tasks.api';
import { api } from '../../lib/api';
import type { User } from '../../types';
import { X } from 'lucide-react';
import { useState } from 'react';

const frequencyLabels = {
  ONCE: 'Один раз',
  DAILY: 'Щоденно',
  WEEKLY: 'Щотижнево',
  MONTHLY: 'Раз на місяць',
  YEARLY: 'Раз на рік',
};

const schema = z.object({
  title: z.string().min(1, 'Введіть назву'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('ONCE'),
  repeatUntil: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  articleMode: z.enum(['none', 'specific', 'all']).default('none'),
  articlesText: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: usersData } = useQuery({
    queryKey: ['users-assignees'],
    queryFn: () =>
      api.get<{ data: Pick<User, 'id' | 'name' | 'role'>[] }>('/users/assignees').then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const articleMode = watch('articleMode');
  const frequency = watch('frequency');
  const isRepeating = frequency !== 'ONCE';

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      let articles: string[] | 'ALL' | undefined;
      if (data.articleMode === 'all') {
        articles = 'ALL';
      } else if (data.articleMode === 'specific' && data.articlesText) {
        articles = data.articlesText
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const toISO = (val?: string) => {
        if (!val) return undefined;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
      };

      return tasksApi.create({
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        frequency: data.frequency,
        repeatUntil: isRepeating ? toISO(data.repeatUntil) : undefined,
        dueDate: toISO(data.dueDate),
        assigneeId: data.assigneeId || undefined,
        articles,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (err: unknown) => {
      const resp = (err as { response?: { data?: { error?: string; details?: { field: string; message: string }[] } } })?.response?.data;
      if (resp?.details?.length) {
        setError(resp.details.map((d) => `${d.field}: ${d.message}`).join('; '));
      } else {
        setError(resp?.error ?? 'Помилка при створенні задачі');
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Нова задача</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          {/* Назва */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Назва *</label>
            <input
              {...register('title')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Опис */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Пріоритет + Дедлайн */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пріоритет</label>
              <select
                {...register('priority')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="LOW">Низький</option>
                <option value="MEDIUM">Середній</option>
                <option value="HIGH">Високий</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн</label>
              <input
                {...register('dueDate')}
                type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Частота */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Частота</label>
            <select
              {...register('frequency')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(frequencyLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Дата закінчення повторень — тільки якщо не "Один раз" */}
          {isRepeating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Повторювати до *
              </label>
              <input
                {...register('repeatUntil')}
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">Вкажіть дату закінчення повторень</p>
            </div>
          )}

          {/* Виконавець */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Виконавець</label>
            <select
              {...register('assigneeId')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">— Не призначено —</option>
              {usersData?.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({roleLabel(u.role)})
                </option>
              ))}
            </select>
          </div>

          {/* Товари */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Товари</label>
            <select
              {...register('articleMode')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="none">Без товарів</option>
              <option value="specific">Конкретні артикули</option>
              <option value="all">Всі товари</option>
            </select>
          </div>

          {articleMode === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Артикули (через кому або з нового рядка)
              </label>
              <textarea
                {...register('articlesText')}
                rows={3}
                placeholder={'ART-001, ART-002\nART-003'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Створення...' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'Адмін',
    MANAGER: 'Менеджер',
    EXECUTOR: 'Виконавець',
  };
  return map[role] ?? role;
}
