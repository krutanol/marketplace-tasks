import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from './auth.store';
import type { User } from '../../types';

const schema = z.object({
  email: z.string().email('Невірний email'),
  password: z.string().min(1, 'Введіть пароль'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post<{ token: string; user: User }>('/auth/login', data).then((r) => r.data),
    onSuccess: ({ token, user }) => {
      useAuthStore.setAuth(token, user);
      navigate('/board');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Вхід в систему</h1>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          {mutation.error && (
            <p className="text-red-500 text-sm">Невірний email або пароль</p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-primary-600 text-white rounded-lg py-2 font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Немає акаунту?{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            Зареєструватись
          </Link>
        </p>
      </div>
    </div>
  );
}
