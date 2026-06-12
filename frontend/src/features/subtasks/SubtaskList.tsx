import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { tasksApi } from '../tasks/tasks.api';
import type { Subtask, SubtaskStatus } from '../../types';
import { CheckSquare, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { cn } from '../../lib/cn';

const statusColors: Record<SubtaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const statusLabels: Record<SubtaskStatus, string> = {
  TODO: 'До виконання',
  IN_PROGRESS: 'В роботі',
  DONE: 'Готово',
};

export function SubtaskList({ taskId, subtasks }: { taskId: string; subtasks: Subtask[] }) {
  const { id } = useParams();
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['task', id] });

  const createSub = useMutation({
    mutationFn: (title: string) => tasksApi.createSubtask(taskId, { title }),
    onSuccess: () => { invalidate(); setNewTitle(''); setAdding(false); },
  });

  const updateSub = useMutation({
    mutationFn: ({ subId, data }: { subId: string; data: Parameters<typeof tasksApi.updateSubtask>[2] }) =>
      tasksApi.updateSubtask(taskId, subId, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteSub = useMutation({
    mutationFn: (subId: string) => tasksApi.deleteSubtask(taskId, subId),
    onSuccess: invalidate,
  });

  const doneCount = subtasks.filter((s) => s.status === 'DONE').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <CheckSquare size={15} />
          Підзадачі {subtasks.length > 0 && `(${doneCount}/${subtasks.length})`}
        </h3>
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <Plus size={14} />
          Додати
        </button>
      </div>

      {/* Progress */}
      {subtasks.length > 0 && (
        <div className="h-1 bg-gray-100 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {subtasks.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50 group">
            {/* Toggle done on click */}
            <button
              onClick={() =>
                updateSub.mutate({ subId: sub.id, data: { status: sub.status === 'DONE' ? 'TODO' : 'DONE' } })
              }
              className={cn(
                'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                sub.status === 'DONE'
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-primary-500'
              )}
            >
              {sub.status === 'DONE' && <Check size={10} className="text-white" />}
            </button>

            {/* Title */}
            {editingId === sub.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editTitle.trim()) {
                    updateSub.mutate({ subId: sub.id, data: { title: editTitle.trim() } });
                  }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 text-sm border-b border-primary-500 outline-none bg-transparent"
              />
            ) : (
              <span className={cn('flex-1 text-sm', sub.status === 'DONE' && 'line-through text-gray-400')}>
                {sub.title}
              </span>
            )}

            {/* Status select */}
            <select
              value={sub.status}
              onChange={(e) => updateSub.mutate({ subId: sub.id, data: { status: e.target.value as SubtaskStatus } })}
              className={cn('text-xs px-1.5 py-0.5 rounded-full border-0 hidden group-hover:block', statusColors[sub.status])}
            >
              {(Object.keys(statusLabels) as SubtaskStatus[]).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>

            {/* Edit / Delete */}
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={() => { setEditingId(sub.id); setEditTitle(sub.title); }}
                className="text-gray-400 hover:text-primary-600 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => {
                  if (confirm('Видалити підзадачу?')) deleteSub.mutate(sub.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Add new subtask */}
        {adding && (
          <div className="flex items-center gap-2 py-1 px-2">
            <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTitle.trim()) createSub.mutate(newTitle.trim());
                if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
              }}
              placeholder="Назва підзадачі..."
              className="flex-1 text-sm border-b border-primary-500 outline-none bg-transparent"
            />
            <button
              onClick={() => newTitle.trim() && createSub.mutate(newTitle.trim())}
              className="text-green-600 hover:text-green-700"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setAdding(false); setNewTitle(''); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
