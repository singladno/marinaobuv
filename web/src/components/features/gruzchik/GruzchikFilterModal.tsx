'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Filter, Check, Tag } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useGruzchikFilter } from '@/contexts/GruzchikFilterContext';
import { useGruzchikView } from '@/contexts/GruzchikViewContext';
import { useGruzchikOrders } from '@/hooks/useGruzchikOrders';
import { ViewToggle } from './ViewToggle';
import { DraggableProviderList } from './DraggableProviderList';
import { cn } from '@/lib/utils';

interface GruzchikFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GruzchikFilterModal({
  isOpen,
  onClose,
}: GruzchikFilterModalProps) {
  const pathname = usePathname();
  const isPurchaseMode = pathname === '/gruzchik/purchase';
  const orderStatus = isPurchaseMode ? 'Купить' : 'Наличие';

  const { filters, updateFilter, clearFilters, hasActiveFilters } =
    useGruzchikFilter();

  const { viewMode, setViewMode } = useGruzchikView();
  const { orders, reload } = useGruzchikOrders(orderStatus);

  // Extract unique providers and clients from orders
  const [providers, setProviders] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [clients, setClients] = useState<
    Array<{ id: string; name: string; phone: string; label: string | null }>
  >([]);

  useEffect(() => {
    if (orders.length > 0) {
      // Extract unique clients from orders
      const clientMap = new Map<
        string,
        { name: string; phone: string; label: string | null }
      >();
      const providerMap = new Map<string, string>();

      orders.forEach(order => {
        // Extract clients - check both order.user and order.phone directly
        // Order can have phone/fullName directly or in order.user
        const phone = order.user?.phone || order.phone;
        const name = order.user?.name || order.fullName;

        if (phone) {
          // Only add if phone exists and is not empty
          const phoneStr = String(phone).trim();
          if (phoneStr) {
            clientMap.set(phoneStr, {
              name: name || 'Без имени',
              phone: phoneStr,
              label: order.label,
            });
          }
        }

        // Extract providers from order items
        order.items.forEach(item => {
          // Try to extract provider from product data or item data
          if (item.product && 'provider' in item.product) {
            const provider = (item.product as any).provider;
            if (provider && provider.id && provider.name) {
              providerMap.set(provider.id, provider.name);
            }
          }
          // Alternative: check if provider info is in item data
          if ((item as any).provider) {
            providerMap.set((item as any).provider, (item as any).provider);
          }
        });
      });

      const clientsList = Array.from(clientMap.entries()).map(([phone, data]) => ({
        id: phone, // phone is already a string from the map key
        ...data,
      }));

      console.log('[GruzchikFilterModal] Extracted clients:', {
        ordersCount: orders.length,
        clientsCount: clientsList.length,
        clients: clientsList,
      });

      setClients(clientsList);

      setProviders(
        Array.from(providerMap.entries()).map(([id, name]) => ({ id, name }))
      );
    }
  }, [orders]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      key={JSON.stringify(filters)}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="flex h-full w-full max-w-md transform flex-col rounded-t-2xl bg-white shadow-xl transition-all sm:h-auto sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Фильтры</h2>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Активны
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {/* View Mode Toggle */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-900">
              Группировка
            </h3>
            <ViewToggle mode={viewMode} onModeChange={setViewMode} />
          </div>

          {/* Availability/Purchase Status Filter */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-900">Фильтры</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const newValue =
                    filters.availabilityStatus === 'unset' ? 'all' : 'unset';
                  updateFilter('availabilityStatus', newValue);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
                  filters.availabilityStatus === 'unset'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="text-sm">
                  {isPurchaseMode ? 'Только некупленые' : 'Только непроверенные'}
                </span>
                {filters.availabilityStatus === 'unset' && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Provider Filter */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-900">
              Поставщик
            </h3>
            <DraggableProviderList
              providers={providers}
              selectedProviderId={isPurchaseMode ? null : filters.providerId}
              selectedProviderIds={isPurchaseMode ? filters.providerIds : undefined}
              onProviderSelect={providerId => {
                if (isPurchaseMode) {
                  // In purchase mode, we use multi-select, so this shouldn't be called
                  // But keep for backward compatibility
                  updateFilter('providerId', providerId);
                } else {
                  updateFilter('providerId', providerId);
                }
              }}
              onProviderToggle={isPurchaseMode ? (providerId) => {
                const currentIds = filters.providerIds || [];
                const newIds = currentIds.includes(providerId)
                  ? currentIds.filter(id => id !== providerId)
                  : [...currentIds, providerId];
                updateFilter('providerIds', newIds);
              } : undefined}
              onClearAll={isPurchaseMode ? () => {
                updateFilter('providerIds', []);
              } : undefined}
              multiSelect={isPurchaseMode}
              emptyMessage={isPurchaseMode ? 'Нет поставщиков' : 'Нет поставщиков в заказах'}
            />
          </div>

          {/* Client Filter */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-900">Клиент</h3>
            <Select
              value={filters.clientId || 'all'}
              onValueChange={value => {
                console.log('[GruzchikFilterModal] Select onValueChange called', {
                  receivedValue: value,
                  valueType: typeof value,
                  currentFilters: filters,
                  willSetTo: value === 'all' ? null : value,
                });
                updateFilter('clientId', value === 'all' ? null : value);
                console.log('[GruzchikFilterModal] After updateFilter call');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите клиента">
                  {filters.clientId
                    ? (() => {
                        const selectedClient = clients.find(
                          c => c.id === filters.clientId
                        );
                        if (selectedClient) {
                          return (
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">
                                  {selectedClient.name}
                                </span>
                                {selectedClient.label && (
                                  <>
                                    <span className="text-gray-400">-</span>
                                    <Tag className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-600">
                                      {selectedClient.label}
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {selectedClient.phone}
                              </span>
                            </div>
                          );
                        }
                        return 'Все клиенты';
                      })()
                    : 'Все клиенты'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все клиенты</SelectItem>
                {clients.length === 0 ? (
                  <SelectItem value="no-clients">
                    Нет клиентов в заказах
                  </SelectItem>
                ) : (
                  clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {client.name}
                          </span>
                          {client.label && (
                            <>
                              <span className="text-gray-400">-</span>
                              <Tag className="h-3 w-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">
                                {client.label}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {client.phone}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-200 px-6 py-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
              disabled={!hasActiveFilters}
            >
              Сбросить
            </Button>
            <Button
              onClick={() => {
                onClose();
              }}
              className="flex-1"
            >
              Применить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
