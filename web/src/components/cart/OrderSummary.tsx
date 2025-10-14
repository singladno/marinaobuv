import { TransportCompany } from '@/lib/shipping';
import {
  calculateSubtotal,
  calculateTotalBoxes,
  calculateTotalBoxPrice,
} from '@/utils/pricing-calculations';

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
  sizes: Array<{ size: string; count: number }>;
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

  // Calculate pricing using utility functions
  // For order summary, we want to show box-based pricing
  const totalBoxPrice = calculateTotalBoxPrice(products);
  const totalBoxes = calculateTotalBoxes(products);

  // Keep the old subtotal for backward compatibility but it should match totalBoxPrice
  const subtotal = totalBoxPrice;

  const total = subtotal;

  return (
    <div className="space-y-6">
      {/* Order Total */}
      <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Детали заказа
          </h3>
          <div className="text-sm text-gray-600">
            <p>Кол-во коробок: {totalBoxes}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>Итого:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={isLoggedIn ? onPlaceOrder : () => setIsLoginModalOpen(true)}
          className="mt-6 w-full rounded-lg bg-purple-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
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
