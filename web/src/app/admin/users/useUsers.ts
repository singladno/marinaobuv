'use client';

import { useState, useEffect, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useDebounce } from '@/hooks/useDebounce';

import type { CreateUserFormData, Provider, User } from './types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState<CreateUserFormData>({
    phone: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CLIENT',
    providerId: '',
  });

  const { addNotification } = useNotifications();
  const debouncedSearch = useDebounce(search, 500);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
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
        title: 'Ошибка',
        message: 'Ошибка при загрузке пользователей',
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, addNotification]);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');

      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    // Validate that either phone or email is provided
    if (!formData.phone && !formData.email) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Необходимо указать либо телефон, либо email',
      });
      setCreating(false);
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Пароли не совпадают',
      });
      setCreating(false);
      return;
    }

    if (formData.password.length < 6) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Пароль должен содержать минимум 6 символов',
      });
      setCreating(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Пользователь создан успешно',
      });

      setShowCreateForm(false);
      setFormData({
        phone: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'CLIENT',
        providerId: '',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message:
          error instanceof Error
            ? error.message
            : 'Ошибка при создании пользователя',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateUser = useCallback(
    async (id: string, updates: Partial<User>) => {
      // Optimistic update - immediately update local state
      setUsers(prevUsers =>
        prevUsers.map(user => (user.id === id ? { ...user, ...updates } : user))
      );

      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }

        const updatedUser = await response.json();

        // Update with server response to ensure consistency
        setUsers(prevUsers =>
          prevUsers.map(user => (user.id === id ? updatedUser : user))
        );

        addNotification({
          type: 'success',
          title: 'Успех',
          message: 'Роль пользователя обновлена',
        });
      } catch (error) {
        console.error('Error updating user:', error);

        // Revert optimistic update on error
        fetchUsers();

        addNotification({
          type: 'error',
          title: 'Ошибка',
          message: 'Ошибка при обновлении роли пользователя',
        });

        throw error;
      }
    },
    [addNotification, fetchUsers]
  );

  const handlePasswordChanged = useCallback(() => {
    addNotification({
      type: 'success',
      title: 'Успех',
      message: 'Пароль пользователя изменен',
    });
  }, [addNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    users,
    providers,
    loading,
    creating,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    showCreateForm,
    setShowCreateForm,
    formData,
    setFormData,
    handleCreateUser,
    updateUser,
    handlePasswordChanged,
  };
}
