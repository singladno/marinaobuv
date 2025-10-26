'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

interface Purchase {
  id: string;
  name: string;
  _count: {
    items: number;
  };
}

interface PurchaseSelectorProps {
  value?: string;
  onChange: (purchase: Purchase | null) => void;
  purchases: Purchase[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function PurchaseSelector({
  value,
  onChange,
  purchases,
  placeholder = 'Выберите закупку',
  disabled = false,
  loading = false,
}: PurchaseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedPurchase = purchases.find(p => p.id === value);

  const filteredPurchases = purchases.filter(purchase =>
    purchase.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (purchase: Purchase) => {
    onChange(purchase);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-full justify-between border-gray-200 bg-white text-left font-normal transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          disabled={disabled || loading}
        >
          <span
            className={
              selectedPurchase ? 'font-medium text-gray-900' : 'text-gray-500'
            }
          >
            {selectedPurchase ? selectedPurchase.name : placeholder}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 overflow-hidden rounded-xl border-0 bg-white p-0 shadow-xl"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-3">
            <Input
              type="text"
              placeholder="Поиск закупок..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border-gray-200 bg-transparent p-0 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 [&::placeholder]:text-gray-600"
            />
          </div>

          {/* Clear Selection */}
          {selectedPurchase && (
            <div className="border-b border-gray-200 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="w-full justify-start text-gray-600 hover:text-gray-900"
              >
                Очистить выбор
              </Button>
            </div>
          )}

          {/* Purchase List */}
          <div className="max-h-80 overflow-auto">
            {loading ? (
              <div className="p-4 text-center">
                <Text className="text-muted-foreground">Загрузка...</Text>
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="p-4 text-center">
                <Text className="text-muted-foreground">
                  {searchTerm ? 'Закупки не найдены' : 'Нет закупок'}
                </Text>
              </div>
            ) : (
              <div className="p-2">
                {filteredPurchases.map(purchase => (
                  <button
                    key={purchase.id}
                    onClick={() => handleSelect(purchase)}
                    className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-gray-50"
                  >
                    <div>
                      <Text className="font-medium">{purchase.name}</Text>
                      <Text className="text-muted-foreground text-sm">
                        {purchase._count.items} товаров
                      </Text>
                    </div>
                    {selectedPurchase?.id === purchase.id && (
                      <Badge variant="secondary">Активна</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
