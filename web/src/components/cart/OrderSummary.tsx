interface Product {
  id: string;
  slug: string;
  name: string;
  article: string | null;
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
  selectedTransport: {
    id: string;
    name: string;
    cost: number;
  } | null;
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

  const shippingCost = selectedTransport?.cost || 0;
  const total = subtotal + shippingCost;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
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
        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoggedIn ? 'Оформить заказ' : 'Войти для оформления заказа'}
      </button>
    </div>
  );
}
