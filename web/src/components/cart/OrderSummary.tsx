import { TransportCompany } from '@/lib/shipping';

interface Product {
  id: string;
  slug: string;
  name: string;
  article?: string;
  pricePair: number;
  images: Array<{ url: string; alt?: string }>;
  category: {
    name: string;
  };
}

interface CartItemWithProduct {
  slug: string;
  qty: number;
  product: Product;
}

interface OrderSummaryProps {
  products: CartItemWithProduct[];
  selectedTransport: TransportCompany | null;
  // Extended props to align with BasketContent usage
  isEditingTransport: boolean;
  setIsEditingTransport: (editing: boolean) => void;
  selectedTransportId: string | null;
  setSelectedTransportId: (id: string | null) => void;
  isLoggedIn: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isEditingUserData: boolean;
  setIsEditingUserData: (editing: boolean) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  orderPhone: string;
  setOrderPhone: (phone: string) => void;
  userFullName: string;
  setUserFullName: (name: string) => void;
  userAddress: string;
  setUserAddress: (address: string) => void;
  onPlaceOrder: () => void;
  isPlacingOrder?: boolean;
}

export function OrderSummary({
  products,
  selectedTransport,
  isEditingTransport,
  setIsEditingTransport,
  selectedTransportId,
  setSelectedTransportId,
  isLoggedIn,
  setIsLoginModalOpen,
  isEditingUserData,
  setIsEditingUserData,
  userEmail,
  setUserEmail,
  orderPhone,
  setOrderPhone,
  userFullName,
  setUserFullName,
  userAddress,
  setUserAddress,
  onPlaceOrder,
  isPlacingOrder,
}: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const subtotal = products.reduce(
    (sum, item) => sum + item.product.pricePair * item.qty,
    0
  );

  const shippingCost = selectedTransport?.priceLabel === 'Бесплатно' ? 0 : 250;
  const total = subtotal + shippingCost;

  return (
    <div className="space-y-6">
      {/* Delivery Summary */}
      <div className="rounded-card bg-card shadow-card border-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Доставка{' '}
            {selectedTransport ? selectedTransport.name : '— не выбрана'}
          </h2>
          <button
            className="text-purple-600 hover:text-purple-700"
            aria-label="Редактировать доставку"
            title="Редактировать доставку"
            onClick={() => setIsEditingTransport(true)}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
        {selectedTransport ? (
          <>
            {selectedTransport.address && (
              <p className="text-sm text-gray-600">
                {selectedTransport.address}
              </p>
            )}
            <p className="text-sm text-gray-500">{selectedTransport.eta}</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Выберите транспортную компанию
          </p>
        )}
      </div>

      {/* Order Total */}
      <div className="rounded-card bg-card shadow-card border-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Итого
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Товары:</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>

          {selectedTransport && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Доставка ({selectedTransport.name}):
              </span>
              <span className="font-medium">{formatPrice(shippingCost)}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 dark:border-gray-600">
            <div className="flex justify-between text-lg font-semibold">
              <span>Итого:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={isLoggedIn ? onPlaceOrder : () => setIsLoginModalOpen(true)}
          className="rounded-card mt-6 w-full bg-purple-600 px-4 py-3 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={!!isPlacingOrder}
        >
          {isLoggedIn ? (
            isPlacingOrder ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Оформляем…
              </span>
            ) : (
              'Оформить заказ'
            )
          ) : (
            'Войти для оформления заказа'
          )}
        </button>

        <div className="mt-4 flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            defaultChecked
            aria-label="Согласие с правилами"
            title="Согласие с правилами"
          />
          <p className="text-xs text-gray-600">
            Соглашаюсь с правилами пользования торговой площадкой и возврата
          </p>
        </div>
      </div>
    </div>
  );
}
