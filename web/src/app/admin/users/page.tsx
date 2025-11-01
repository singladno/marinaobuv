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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Пользователи
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Управление пользователями системы
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
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
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
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
