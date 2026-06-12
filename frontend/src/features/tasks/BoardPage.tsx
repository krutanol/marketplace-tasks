import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { tasksApi, type TaskFilters } from './tasks.api';
import { TaskCard } from './TaskCard';
import { TaskFiltersBar } from './TaskFiltersBar';
import { CreateTaskModal } from './CreateTaskModal';
import type { Task, TaskStatus } from '../../types';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../users/auth.store';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'До виконання', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'В роботі', color: 'bg-blue-50' },
  { id: 'DONE', label: 'Готово', color: 'bg-green-50' },
  { id: 'CANCELLED', label: 'Скасовано', color: 'bg-red-50' },
];

export function BoardPage() {
  const [filters, setFilters] = useState<TaskFilters>({ limit: 100 });
  const [showCreate, setShowCreate] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.list(filters),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const tasks = data?.data ?? [];

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;

    // Виконавець може перетягувати тільки свої задачі
    if (user?.role === 'EXECUTOR' && task.assigneeId !== user.id) return;

    updateStatus.mutate({ id: task.id, status: newStatus });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Завантаження...</div>;
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Дошка задач</h1>
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Нова задача
          </button>
        )}
      </div>

      <TaskFiltersBar filters={filters} onChange={setFilters} />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 mt-4 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={colTasks}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function BoardColumn({
  column,
  tasks,
}: {
  column: { id: TaskStatus; label: string; color: string };
  tasks: Task[];
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl ${column.color} p-3 min-w-72 w-72 flex-shrink-0`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm">{column.label}</h2>
        <span className="bg-white text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
