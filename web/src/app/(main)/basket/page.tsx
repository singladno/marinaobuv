'use client';

import { BasketContent } from '@/components/cart/BasketContent';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { LoadingSpinner } from '@/components/cart/LoadingSpinner';
import { LoginModal } from '@/components/cart/LoginModal';
import { useBasketPage } from '@/hooks/useBasketPage';
import { useBasketPageHandlers } from '@/hooks/useBasketPageHandlers';
import { useOrderHandlers } from '@/hooks/useOrderHandlers';

export default function BasketPage() {
  const basketState = useBasketPage();
  const handlers = useBasketPageHandlers({
    setLoginLoading: basketState.setLoginLoading,
    setLoginError: basketState.setLoginError,
    setOtpSent: basketState.setOtpSent,
    setUserId: basketState.setUserId,
    setIsLoggedIn: () => {}, // This will be handled by the main hook
    setIsLoginModalOpen: basketState.setIsLoginModalOpen,
    addNotification: basketState.addNotification,
    phone: basketState.phone,
  });

  const orderHandlers = useOrderHandlers({
    products: basketState.products,
    selectedTransportId: basketState.selectedTransportId,
    orderPhone: basketState.orderPhone,
    userFullName: basketState.userFullName,
    userAddress: basketState.userAddress,
    userEmail: basketState.userEmail,
    addNotification: basketState.addNotification,
    clear: basketState.clear,
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
          validationErrors={basketState.validationErrors}
          onPlaceOrder={orderHandlers.handlePlaceOrder}
          onRemove={basketState.remove}
          onUpdateQuantity={basketState.updateQuantity}
        />
      )}

      <LoginModal
        isOpen={basketState.isLoginModalOpen}
        onClose={() => basketState.setIsLoginModalOpen(false)}
        phone={basketState.phone}
        setPhone={basketState.setPhone}
        otpCode={basketState.otpCode}
        setOtpCode={basketState.setOtpCode}
        otpSent={basketState.otpSent}
        loginLoading={basketState.loginLoading}
        loginError={basketState.loginError}
        setOtpSent={basketState.setOtpSent}
        setLoginLoading={basketState.setLoginLoading}
        setLoginError={basketState.setLoginError}
        onSendOtp={handlers.handleRequestOtp}
        onLogin={handlers.handleLogin}
      />

      {null}
    </div>
  );
}
