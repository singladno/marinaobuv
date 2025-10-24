'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { CreateUserForm } from './CreateUserForm';
import { UserFilters } from './UserFilters';
import { UserPagination } from './UserPagination';
import { UserTable } from './UserTable';
import { useUsers } from './useUsers';
import { formatDate, getRoleLabel } from './utils';

export default function AdminUsersPage() {
  const {
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
    totalPages,
    showCreateForm,
    setShowCreateForm,
    formData,
    setFormData,
    handleCreateUser,
    updateUser,
    handlePasswordChanged,
  } = useUsers();

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
      <UserFilters
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
      />

      {/* Users Table */}
      <div className="overflow-visible rounded-lg bg-white shadow dark:bg-gray-800">
        <UserTable
          users={users}
          loading={loading}
          getRoleLabel={getRoleLabel}
          formatDate={formatDate}
          onUpdateUser={updateUser}
          onPasswordChanged={handlePasswordChanged}
        />

        {/* Pagination */}
        <UserPagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Создать пользователя"
        size="sm"
      >
        <CreateUserForm
          formData={formData}
          setFormData={setFormData}
          providers={providers}
          onSubmit={handleCreateUser}
          creating={creating}
        />
      </Modal>
    </div>
  );
}
