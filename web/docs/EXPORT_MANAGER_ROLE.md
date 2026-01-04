# Роль EXPORT_MANAGER

## Описание

Роль `EXPORT_MANAGER` предназначена для пользователей, которым нужен доступ только к функциям экспорта товаров, без доступа к другим административным функциям системы.

## Права доступа

### ✅ Разрешенные действия

- Экспорт товаров через API (`/api/admin/products/export`)
- Просмотр списка доступных экспортов (`/api/admin/products/export/list`)
- Скачивание файлов экспорта (`/api/admin/products/export/download/[filename]`)
- Использование утилит для получения ссылок на экспорты

### ❌ Запрещенные действия

- Управление товарами (создание, редактирование, удаление)
- Управление заказами
- Управление пользователями
- Доступ к другим административным разделам
- Изменение настроек системы

## Назначение роли

### Через админ-панель

1. Перейдите в раздел "Пользователи"
2. Создайте нового пользователя или откройте существующего
3. В поле "Роль" выберите "Менеджер экспорта" (`EXPORT_MANAGER`)
4. Сохраните изменения

### Через базу данных

```sql
UPDATE "User"
SET role = 'EXPORT_MANAGER'
WHERE email = 'user@example.com';
```

## Миграция базы данных

Роль автоматически добавляется в базу данных при применении миграции:

```bash
# Миграция применяется автоматически при деплое
npx prisma migrate deploy

# Или вручную
cd web
npx prisma migrate deploy
```

Миграция: `20260103162347_add_export_manager_role`

## Использование API

### Пример запроса с ролью EXPORT_MANAGER

```bash
# Экспорт товаров
curl -H "Authorization: Bearer <token>" \
  "https://your-domain.com/api/admin/products/export?format=csv"

# Список экспортов
curl -H "Authorization: Bearer <token>" \
  "https://your-domain.com/api/admin/products/export/list"

# Скачать файл
curl -H "Authorization: Bearer <token>" \
  "https://your-domain.com/api/admin/products/export/download/products-export-2025-01-15.csv" \
  -o export.csv
```

## Безопасность

- Роль `EXPORT_MANAGER` имеет ограниченный доступ только к функциям экспорта
- Администраторы (`ADMIN`) сохраняют полный доступ ко всем функциям, включая экспорт
- Все запросы к API требуют авторизации
- Файлы экспорта загружаются в S3 с публичными URL, но доступ к API защищен

## Технические детали

### Обновление кода

Роль добавлена в:
- `prisma/schema.prisma` — enum Role
- `src/lib/server/auth-helpers.ts` — типы и helper функции
- `src/app/api/admin/products/export/**` — проверка доступа
- `src/components/features/EditableRoleBadge.tsx` — UI для выбора роли
- `src/app/admin/users/CreateUserForm.tsx` — форма создания пользователя
- `src/app/admin/users/utils.ts` — функция получения метки роли

### Проверка доступа

В API endpoints используется helper функция:

```typescript
function hasExportAccess(role: string): boolean {
  return role === 'ADMIN' || role === 'EXPORT_MANAGER';
}
```

## Миграция при деплое

Миграция применяется автоматически при деплое через CI/CD:

1. Скрипты деплоя выполняют `prisma migrate deploy`
2. Миграция добавляет значение `EXPORT_MANAGER` в enum `Role`
3. После применения миграции роль становится доступной для назначения

## Примеры использования

### Создание пользователя с ролью EXPORT_MANAGER

```typescript
// Через Prisma
await prisma.user.create({
  data: {
    email: 'export@example.com',
    passwordHash: await hashPassword('secure-password'),
    role: 'EXPORT_MANAGER',
    name: 'Export Manager',
  },
});
```

### Проверка доступа в коде

```typescript
import { hasExportAccess } from '@/lib/server/auth-helpers';

const canExport = await hasExportAccess(request);
if (!canExport) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Поддержка

При возникновении проблем с доступом:
1. Проверьте, что роль назначена пользователю
2. Убедитесь, что миграция применена к базе данных
3. Проверьте, что пользователь авторизован
4. Проверьте логи сервера на наличие ошибок
