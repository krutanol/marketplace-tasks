import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import { useAuthStore } from './auth.store';
import type { PaginatedResponse, User } from '../../types';
import { Plus, Key, Trash2, X, Pencil } from 'lucide-react';

// ── Схеми ──────────────────────────────────────────────────────────
const createSchema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи'),
  email: z.string().email('Невірний email'),
  password: z
    .string()
    .min(8, 'Мінімум 8 символів')
    .regex(/[A-Z]/, 'Потрібна велика літера')
    .regex(/[0-9]/, 'Потрібна цифра'),
  role: z.enum(['ADMIN', 'MANAGER', 'EXECUTOR']).default('EXECUTOR'),
});

const editSchema = z.object({
  name: z.string().min(2, 'Мінімум 2 символи'),
  role: z.enum(['ADMIN', 'MANAGER', 'EXECUTOR']),
  isActive: z.boolean(),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

const roleLabels: Record<string, string> = {
  ADMIN: 'Адмін',
  MANAGER: 'Менеджер',
  EXECUTOR: 'Виконавець',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  EXECUTOR: 'bg-gray-100 text-gray-700',
};

// ── Головний компонент ──────────────────────────────────────────────
export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<PaginatedResponse<User>>('/users').then((r) => r.data),
    enabled: currentUser?.role === 'ADMIN',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const generateKey = useMutation({
    mutationFn: (id: string) =>
      api.post<{ apiKey: string }>(`/users/${id}/generate-api-key`).then((r) => r.data),
    onSuccess: (data) => alert(`API Key: ${data.apiKey}`),
  });

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-gray-500">
        Тільки адміністратори мають доступ до цієї сторінки
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Користувачі</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Додати користувача
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Завантаження...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Ім'я</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Роль</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {user.isActive ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditUser(user)}
                        title="Редагувати"
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => generateKey.mutate(user.id)}
                        title="Згенерувати API ключ"
                        className="text-gray-400 hover:text-yellow-600 transition-colors"
                      >
                        <Key size={15} />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Видалити користувача "${user.name}"? Цю дію не можна скасувати.`)) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          title="Видалити"
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
    </div>
  );
}

// ── Модалка створення ───────────────────────────────────────────────
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'EXECUTOR' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateData) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-assignees'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setServerError(msg ?? 'Помилка при створенні');
    },
  });

  return (
    <Modal title="Новий користувач" onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Field label="Ім'я" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register('email')} type="email" className={inputCls} />
        </Field>
        <Field label="Пароль" error={errors.password?.message}>
          <input {...register('password')} type="password" className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">Мінімум 8 символів, велика літера та цифра</p>
        </Field>
        <Field label="Роль">
          <select {...register('role')} className={inputCls}>
            <option value="EXECUTOR">Виконавець</option>
            <option value="MANAGER">Менеджер</option>
            <option value="ADMIN">Адмін</option>
          </select>
        </Field>
        {serverError && <p className="text-red-500 text-sm">{serverError}</p>}
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Створити" />
      </form>
    </Modal>
  );
}

// ── Модалка редагування ─────────────────────────────────────────────
function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      role: user.role as 'ADMIN' | 'MANAGER' | 'EXECUTOR',
      isActive: user.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EditData) => api.patch(`/users/${user.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-assignees'] });
      onClose();
    },
  });

  return (
    <Modal title={`Редагувати: ${user.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <Field label="Ім'я" error={errors.name?.message}>
          <input {...register('name')} className={inputCls} />
        </Field>
        <Field label="Роль">
          <select {...register('role')} className={inputCls}>
            <option value="EXECUTOR">Виконавець</option>
            <option value="MANAGER">Менеджер</option>
            <option value="ADMIN">Адмін</option>
          </select>
        </Field>
        <Field label="Статус">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('isActive')} type="checkbox" className="w-4 h-4" />
            <span className="text-sm text-gray-700">Активний</span>
          </label>
        </Field>
        <ModalButtons onClose={onClose} loading={mutation.isPending} label="Зберегти" />
      </form>
    </Modal>
  );
}

// ── Допоміжні компоненти ────────────────────────────────────────────
const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function ModalButtons({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) {
  return (
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
        disabled={loading}
        className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Збереження...' : label}
      </button>
    </div>
  );
}
