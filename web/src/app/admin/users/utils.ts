export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Администратор',
    PROVIDER: 'Поставщик',
    GRUZCHIK: 'Грузчик',
    CLIENT: 'Клиент',
    EXPORT_MANAGER: 'Менеджер экспорта',
  };
  return labels[role] || role;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
