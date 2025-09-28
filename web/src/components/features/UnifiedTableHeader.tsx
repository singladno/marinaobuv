import { Tabs, Tab } from '@/components/ui/Tabs';

interface UnifiedTableHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReload: () => void;
  onColumnSettings: () => void;
}

export function UnifiedTableHeader({
  activeTab,
  onTabChange,
  onReload,
  onColumnSettings,
}: UnifiedTableHeaderProps) {
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <Tab value="drafts">Черновики</Tab>
        <Tab value="products">Товары</Tab>
        <Tab value="orders">Заказы</Tab>
      </Tabs>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onReload}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          >
            Обновить
          </button>
          <button
            onClick={onColumnSettings}
            className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
          >
            Настройки колонок
          </button>
        </div>
      </div>
    </div>
  );
}
