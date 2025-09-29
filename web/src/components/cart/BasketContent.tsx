import { CartItemsList } from '@/components/cart/CartItemsList';
import { OrderSummary } from '@/components/cart/OrderSummary';

interface CartItemWithProduct {
  slug: string;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    pricePair: number;
    images: Array<{ url: string; alt?: string }>;
    category: { name: string };
    article?: string;
  };
}

interface BasketContentProps {
  products: CartItemWithProduct[];
  selectedTransport: {
    id: string;
    name: string;
    cost: number;
  } | null;
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
  onRemove: (slug: string) => void;
  onUpdateQuantity: (slug: string, quantity: number) => void;
}

export function BasketContent({
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
  onRemove,
  onUpdateQuantity,
}: BasketContentProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CartItemsList
          items={products}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
        />
      </div>

      <OrderSummary
        products={products}
        selectedTransport={selectedTransport}
        isEditingTransport={isEditingTransport}
        setIsEditingTransport={setIsEditingTransport}
        selectedTransportId={selectedTransportId}
        setSelectedTransportId={setSelectedTransportId}
        isLoggedIn={isLoggedIn}
        setIsLoginModalOpen={setIsLoginModalOpen}
        isEditingUserData={isEditingUserData}
        setIsEditingUserData={setIsEditingUserData}
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        orderPhone={orderPhone}
        setOrderPhone={setOrderPhone}
        userFullName={userFullName}
        setUserFullName={setUserFullName}
        userAddress={userAddress}
        setUserAddress={setUserAddress}
        onPlaceOrder={onPlaceOrder}
      />
    </div>
  );
}
