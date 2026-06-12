import type { TaskFilters } from './tasks.api';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
}

export function TaskFiltersBar({ filters, onChange }: Props) {
  const [articleInput, setArticleInput] = useState(filters.article ?? '');

  function update(patch: Partial<TaskFilters>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  function clearAll() {
    setArticleInput('');
    onChange({ limit: 100 });
  }

  const hasFilters =
    filters.status || filters.priority || filters.assigneeId || filters.article;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Status filter */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => update({ status: e.target.value || undefined })}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Всі статуси</option>
        <option value="TODO">До виконання</option>
        <option value="IN_PROGRESS">В роботі</option>
        <option value="DONE">Готово</option>
        <option value="CANCELLED">Скасовано</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority ?? ''}
        onChange={(e) => update({ priority: e.target.value || undefined })}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Всі пріоритети</option>
        <option value="LOW">Низький</option>
        <option value="MEDIUM">Середній</option>
        <option value="HIGH">Високий</option>
      </select>

      {/* Article filter */}
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={articleInput}
          onChange={(e) => setArticleInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update({ article: articleInput || undefined });
          }}
          onBlur={() => update({ article: articleInput || undefined })}
          placeholder="Артикул..."
          className="text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <X size={14} />
          Скинути
        </button>
      )}
    </div>
  );
}
