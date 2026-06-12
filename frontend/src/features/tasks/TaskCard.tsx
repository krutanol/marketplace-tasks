import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import type { Task, Frequency } from '../../types';
import { cn } from '../../lib/cn';
import { Calendar, Package, CheckSquare, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

const priorityLabels = {
  LOW: 'Низький',
  MEDIUM: 'Середній',
  HIGH: 'Високий',
};

const frequencyLabels: Record<Frequency, string> = {
  ONCE: '',
  DAILY: 'Щодня',
  WEEKLY: 'Щотижня',
  MONTHLY: 'Щомісяця',
  YEARLY: 'Щороку',
};

export function TaskCard({ task, isDragging = false }: { task: Task; isDragging?: boolean }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const doneSubtasks = task.subtasks?.filter((s) => s.status === 'DONE').length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? task._count?.subtasks ?? 0;
  const articleCount = task.taskArticles?.length ?? task._count?.taskArticles ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={cn(
        'bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all select-none',
        isDragging && 'opacity-50 shadow-lg rotate-2'
      )}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            priorityColors[task.priority]
          )}
        >
          {priorityLabels[task.priority]}
        </span>
        {task.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-medium"
            title={task.assignee.name}
          >
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">{task.title}</p>

      {/* Footer info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 flex-wrap">
        {articleCount > 0 && (
          <span className="flex items-center gap-1">
            <Package size={12} />
            {articleCount}
          </span>
        )}
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1">
            <CheckSquare size={12} />
            {doneSubtasks}/{totalSubtasks}
          </span>
        )}
        {task.frequency && task.frequency !== 'ONCE' && (
          <span className="flex items-center gap-1 text-blue-500">
            <RefreshCw size={12} />
            {frequencyLabels[task.frequency]}
          </span>
        )}
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {format(new Date(task.dueDate), 'd MMM', { locale: uk })}
          </span>
        )}
      </div>
    </div>
  );
}
