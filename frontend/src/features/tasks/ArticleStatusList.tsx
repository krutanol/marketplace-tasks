import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { tasksApi } from './tasks.api';
import type { TaskArticle, ArticleTaskStatus } from '../../types';
import { Package } from 'lucide-react';
import { cn } from '../../lib/cn';

const statusLabels: Record<ArticleTaskStatus, string> = {
  PENDING: 'Очікує',
  IN_PROGRESS: 'В роботі',
  DONE: 'Готово',
  CANCELLED: 'Скасовано',
};

const statusColors: Record<ArticleTaskStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

export function ArticleStatusList({
  taskId,
  articles,
}: {
  taskId: string;
  articles: TaskArticle[];
}) {
  const { id } = useParams();
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ article, status }: { article: string; status: string }) =>
      tasksApi.updateArticleStatus(taskId, article, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }),
  });

  const doneCount = articles.filter((a) => a.status === 'DONE').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Package size={15} />
          Товари ({articles.length})
        </h3>
        <span className="text-xs text-gray-500">
          {doneCount}/{articles.length} готово
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${articles.length ? (doneCount / articles.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {articles.map((ta) => (
          <div
            key={ta.id}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50"
          >
            <div>
              <span className="text-sm font-mono text-gray-700">{ta.product.article}</span>
              <span className="text-xs text-gray-400 ml-2">{ta.product.name}</span>
            </div>
            <select
              value={ta.status}
              onChange={(e) =>
                updateStatus.mutate({ article: ta.product.article, status: e.target.value })
              }
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer',
                statusColors[ta.status]
              )}
            >
              {(Object.keys(statusLabels) as ArticleTaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
