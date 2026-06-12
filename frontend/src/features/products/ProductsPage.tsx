import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../users/auth.store';
import type { PaginatedResponse, Product } from '../../types';
import { Plus, Upload, Search, Trash2 } from 'lucide-react';

export function ProductsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [newArticle, setNewArticle] = useState('');
  const [newName, setNewName] = useState('');
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () =>
      api
        .get<PaginatedResponse<Product>>('/products', { params: { page, limit: 20, search: search || undefined } })
        .then((r) => r.data),
  });

  const createProduct = useMutation({
    mutationFn: (d: { article: string; name: string }) => api.post('/products', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowAdd(false);
      setNewArticle('');
      setNewName('');
    },
  });

  const importProducts = useMutation({
    mutationFn: (products: { article: string; name: string }[]) =>
      api.post('/products/import', { products }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['products'] });
      alert(`Імпортовано: ${data.imported}, помилок: ${data.failed}`);
      setShowImport(false);
      setImportText('');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (article: string) => api.delete(`/products/${article}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  function handleImport() {
    const lines = importText.trim().split('\n').filter(Boolean);
    const products = lines.map((line) => {
      const [article, ...rest] = line.split(',');
      return { article: article.trim(), name: rest.join(',').trim() || article.trim() };
    });
    importProducts.mutate(products);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Товари</h1>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <Upload size={15} />
              Імпорт CSV
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-primary-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-primary-700 transition-colors"
            >
              <Plus size={15} />
              Додати
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Пошук за артикулом або назвою..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Add form inline */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Артикул</label>
            <input
              value={newArticle}
              onChange={(e) => setNewArticle(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Назва товару</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => createProduct.mutate({ article: newArticle, name: newName })}
            disabled={!newArticle || !newName}
            className="bg-primary-600 text-white rounded-lg px-4 py-1.5 text-sm hover:bg-primary-700 disabled:opacity-50"
          >
            Зберегти
          </button>
          <button onClick={() => setShowAdd(false)} className="text-gray-500 text-sm">
            Скасувати
          </button>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-3">Імпорт товарів</h2>
            <p className="text-sm text-gray-500 mb-3">
              Кожен рядок: <code className="bg-gray-100 px-1 rounded">АРТИКУЛ,Назва товару</code>
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder={'ART-001,Назва товару 1\nART-002,Назва товару 2'}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={handleImport} className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm hover:bg-primary-700">
                Імпортувати
              </button>
              <button onClick={() => setShowImport(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-gray-500">Завантаження...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Артикул</th>
                  <th className="px-4 py-3 text-left">Назва</th>
                  <th className="px-4 py-3 text-left">Дата додавання</th>
                  {canEdit && <th className="px-4 py-3 text-left">Дії</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.data.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">{p.article}</td>
                    <td className="px-4 py-3 text-gray-700">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('uk-UA')}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm(`Видалити товар ${p.article}?`)) deleteProduct.mutate(p.article);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                Показано {(page - 1) * 20 + 1}–{Math.min(page * 20, data.meta.total)} з {data.meta.total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.meta.totalPages}
                  className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
