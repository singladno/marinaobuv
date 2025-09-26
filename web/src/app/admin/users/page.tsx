'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Modal } from '@/components/ui/Modal';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useDebounce } from '@/hooks/useDebounce';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  providerId: string | null;
  provider: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
}

interface Provider {
  id: string;
  name: string;
  phone: string | null;
  place: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    role: 'CLIENT',
    providerId: '',
  });

  const { addNotification } = useNotifications();

  // Debounced search value
  const debouncedSearch = useDebounce(search, 500);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching users:', error);
      addNotification({
        type: 'error',
        message: 'Ошибка при загрузке пользователей',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch providers
  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');

      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone || !formData.role) {
      addNotification({
        type: 'error',
        message: 'Заполните все обязательные поля',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      addNotification({
        type: 'success',
        message: 'Пользователь успешно создан',
      });

      setFormData({
        phone: '',
        name: '',
        role: 'CLIENT',
        providerId: '',
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      addNotification({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Ошибка при создании пользователя',
      });
    } finally {
      setCreating(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Администратор',
      PROVIDER: 'Поставщик',
      GRUZCHIK: 'Грузчик',
      CLIENT: 'Клиент',
    };
    return labels[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Пользователи
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление пользователями системы
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Создать пользователя
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          aria-label="Фильтр по роли"
        >
          <option value="">Все роли</option>
          <option value="ADMIN">Администратор</option>
          <option value="PROVIDER">Поставщик</option>
          <option value="GRUZCHIK">Грузчик</option>
          <option value="CLIENT">Клиент</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Роль
                </th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Поставщик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Статистика
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Создан
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Загрузка...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'Без имени'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="w-48 whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {user.provider?.name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div>Заказы: {user._count.orders}</div>
                      <div>Отзывы: {user._count.reviews}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
              >
                Предыдущая
              </Button>
              <Button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                variant="outline"
              >
                Следующая
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Страница <span className="font-medium">{page}</span> из{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                    className="rounded-l-md"
                  >
                    Предыдущая
                  </Button>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    className="rounded-r-md"
                  >
                    Следующая
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Создать пользователя"
        size="sm"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 p-6">
          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Телефон *
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={phone => setFormData({ ...formData, phone })}
              className="w-full"
              required
            />
          </div>

          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Имя
            </label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Имя пользователя"
              className="w-full"
            />
          </div>

          <div className="w-full">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Роль *
            </label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
              aria-label="Выберите роль"
            >
              <option value="">Выберите роль</option>
              <option value="CLIENT">Клиент</option>
              <option value="PROVIDER">Поставщик</option>
              <option value="GRUZCHIK">Грузчик</option>
              <option value="ADMIN">Администратор</option>
            </select>
          </div>

          {formData.role === 'PROVIDER' && (
            <div className="w-full">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Поставщик
              </label>
              <select
                value={formData.providerId}
                onChange={e =>
                  setFormData({ ...formData, providerId: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                aria-label="Выберите поставщика"
              >
                <option value="">Выберите поставщика</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={creating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {creating ? 'Создание...' : 'Создать'}
            </Button>
            <Button
              type="button"
              onClick={() => setShowCreateForm(false)}
              variant="outline"
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
