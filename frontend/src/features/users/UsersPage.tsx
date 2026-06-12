import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from './auth.store';
import type { PaginatedResponse, User } from '../../types';
import { Key, UserX } from 'lucide-react';

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<PaginatedResponse<User>>('/users').then((r) => r.data),
    enabled: currentUser?.role === 'ADMIN',
  });

  const generateKey = useMutation({
    mutationFn: (id: string) =>
      api.post<{ apiKey: string }>(`/users/${id}/generate-api-key`).then((r) => r.data),
    onSuccess: (data) => {
      alert(`API Key: ${data.apiKey}`);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-gray-500">Тільки адміністратори мають доступ до цієї сторінки</div>
    );
  }

  if (isLoading) return <div className="p-8">Завантаження...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Користувачі</h1>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
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
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.isActive ? 'Активний' : 'Деактивований'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateKey.mutate(user.id)}
                      title="Згенерувати API ключ"
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Key size={16} />
                    </button>
                    {user.isActive && user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (confirm(`Деактивувати ${user.name}?`)) deactivate.mutate(user.id);
                        }}
                        title="Деактивувати"
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <UserX size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    EXECUTOR: 'bg-gray-100 text-gray-700',
  };
  const labels: Record<string, string> = {
    ADMIN: 'Адмін',
    MANAGER: 'Менеджер',
    EXECUTOR: 'Виконавець',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[role] ?? ''}`}>
      {labels[role] ?? role}
    </span>
  );
}
