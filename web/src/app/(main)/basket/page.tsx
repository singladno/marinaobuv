'use client';

import { BasketContent } from '@/components/cart/BasketContent';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { LoadingSpinner } from '@/components/cart/LoadingSpinner';
import { AuthModal } from '@/components/auth/AuthModal';
import { useBasketPage } from '@/hooks/useBasketPage';
import { useBasketPageHandlers } from '@/hooks/useBasketPageHandlers';
import { useOrderHandlers } from '@/hooks/useOrderHandlers';

export default function BasketPage() {
  const basketState = useBasketPage();
  const handlers = useBasketPageHandlers({
    setLoginLoading: basketState.setLoginLoading,
    setLoginError: basketState.setLoginError,
    setUserId: basketState.setUserId,
    setIsLoggedIn: () => {}, // This will be handled by the main hook
    setIsLoginModalOpen: basketState.setIsLoginModalOpen,
    addNotification: basketState.addNotification,
  });

  const orderHandlers = useOrderHandlers({
    products: basketState.products,
    selectedTransportId: basketState.selectedTransportId,
    orderPhone: basketState.orderPhone,
    userFullName: basketState.userFullName,
    userAddress: basketState.userAddress,
    userEmail: basketState.userEmail,
    orderComment: basketState.orderComment,
    addNotification: basketState.addNotification,
    clear: basketState.clear,
    clearTransportCompany: basketState.clearTransportCompany,
    setIsCheckoutModalOpen: handlers.setIsCheckoutModalOpen,
    setValidationErrors: basketState.setValidationErrors,
  });

  if (basketState.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Корзина</h1>

      {basketState.products.length === 0 ? (
        <EmptyCart />
      ) : (
        <BasketContent
          products={basketState.products}
          selectedTransport={basketState.selectedTransport}
          isEditingTransport={basketState.isEditingTransport}
          setIsEditingTransport={basketState.setIsEditingTransport}
          selectedTransportId={basketState.selectedTransportId}
          setSelectedTransportId={basketState.setSelectedTransportId}
          setSelectedTransportCompany={basketState.setSelectedTransportCompany}
          isLoggedIn={basketState.isLoggedIn}
          setIsLoginModalOpen={basketState.setIsLoginModalOpen}
          isEditingUserData={basketState.isEditingUserData}
          setIsEditingUserData={basketState.setIsEditingUserData}
          userEmail={basketState.userEmail}
          setUserEmail={basketState.setUserEmail}
          orderPhone={basketState.orderPhone}
          setOrderPhone={basketState.setOrderPhone}
          userFullName={basketState.userFullName}
          setUserFullName={basketState.setUserFullName}
          userAddress={basketState.userAddress}
          setUserAddress={basketState.setUserAddress}
          orderComment={basketState.orderComment}
          setOrderComment={basketState.setOrderComment}
          isEditingComment={basketState.isEditingComment}
          setIsEditingComment={basketState.setIsEditingComment}
          validationErrors={basketState.validationErrors}
          onPlaceOrder={orderHandlers.handlePlaceOrder}
          isPlacingOrder={orderHandlers.isPlacingOrder}
          onRemove={basketState.remove}
          onUpdateQuantity={basketState.updateQuantity}
          onToggleFavorite={basketState.handleToggleFavorite}
          favorites={basketState.favorites}
          updatingItems={basketState.updatingItems}
          removingItems={basketState.removingItems}
        />
      )}

      <AuthModal
        isOpen={basketState.isLoginModalOpen}
        onClose={() => basketState.setIsLoginModalOpen(false)}
      />

      {null}
    </div>
  );
}
