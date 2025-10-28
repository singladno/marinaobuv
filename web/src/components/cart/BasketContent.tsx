import { CartItemsList } from '@/components/cart/CartItemsList';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { OrderComment } from '@/components/cart/OrderComment';
import TransportCompanySelector from '@/components/features/TransportCompanySelector';
import TransportOptionSelector, {
  TransportOption,
} from '@/components/features/TransportOptionSelector';
import { popularTransportCompanies, TransportCompany } from '@/lib/shipping';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressInput } from '@/components/ui/AddressInput';
import { useEffect, useRef } from 'react';

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
    sizes: Array<{ size: string; count: number }>;
  };
}

interface BasketContentProps {
  products: CartItemWithProduct[];
  selectedTransport: TransportCompany | null;
  isEditingTransport: boolean;
  setIsEditingTransport: (editing: boolean) => void;
  selectedTransportId: string | null;
  setSelectedTransportId: (id: string | null) => void;
  setSelectedTransportCompany?: (company: TransportCompany) => void;
  selectedTransportOptions: TransportOption[];
  setSelectedTransportOptions: (options: TransportOption[]) => void;
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
  orderComment: string;
  setOrderComment: (comment: string) => void;
  isEditingComment: boolean;
  setIsEditingComment: (editing: boolean) => void;
  validationErrors?: {
    transport?: boolean;
    userData?: boolean;
  };
  onPlaceOrder: () => void;
  isPlacingOrder?: boolean;
  onRemove: (slug: string) => void;
  onUpdateQuantity: (slug: string, quantity: number) => void;
  onToggleFavorite?: (slug: string) => void;
  favorites?: Set<string>;
  updatingItems?: Set<string>;
  removingItems?: Set<string>;
  // Add scroll trigger prop
  scrollTrigger?: number;
}

export function BasketContent({
  products,
  selectedTransport,
  isEditingTransport,
  setIsEditingTransport,
  selectedTransportId,
  setSelectedTransportId,
  setSelectedTransportCompany,
  selectedTransportOptions,
  setSelectedTransportOptions,
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
  orderComment,
  setOrderComment,
  isEditingComment,
  setIsEditingComment,
  validationErrors,
  onPlaceOrder,
  isPlacingOrder,
  onRemove,
  onUpdateQuantity,
  onToggleFavorite,
  favorites = new Set(),
  updatingItems = new Set(),
  removingItems = new Set(),
  scrollTrigger,
}: BasketContentProps) {
  const transportSectionRef = useRef<HTMLDivElement>(null);
  const userDataSectionRef = useRef<HTMLDivElement>(null);

  // Debug: Log validation errors
  useEffect(() => {
    console.log('BasketContent validation errors:', validationErrors);
    console.log('Current field values:', {
      userFullName,
      orderPhone,
      userAddress,
    });
  }, [validationErrors, userFullName, orderPhone, userAddress]);

  // Auto-scroll and open sections when validation fails or scrollTrigger changes
  useEffect(() => {
    if (validationErrors?.transport && transportSectionRef.current) {
      setIsEditingTransport(true);
      setTimeout(() => {
        transportSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [validationErrors?.transport, setIsEditingTransport, scrollTrigger]);

  useEffect(() => {
    if (validationErrors?.userData && userDataSectionRef.current) {
      setIsEditingUserData(true);
      setTimeout(() => {
        userDataSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [validationErrors?.userData, setIsEditingUserData, scrollTrigger]);
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <CartItemsList
          items={products}
          onRemove={onRemove}
          onUpdateQuantity={onUpdateQuantity}
          onToggleFavorite={onToggleFavorite}
          favorites={favorites}
          updatingItems={updatingItems}
          removingItems={removingItems}
        />

        {/* Transport Company Selection Section */}
        <div
          ref={transportSectionRef}
          className={`rounded-card bg-card shadow-card p-6 ${validationErrors?.transport ? 'border-2 border-purple-500' : 'border-card'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Выбор транспортной компании
              {validationErrors?.transport && (
                <span className="ml-2 text-sm font-medium text-purple-600">
                  (обязательно)
                </span>
              )}
            </h2>
            <button
              className="text-purple-600 hover:text-purple-700"
              aria-label="Редактировать выбор ТК"
              title="Редактировать выбор ТК"
              onClick={() => setIsEditingTransport(!isEditingTransport)}
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
          {isEditingTransport ? (
            <div className="space-y-4">
              {validationErrors?.transport &&
                selectedTransportOptions.length === 0 && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="mb-1 text-sm font-medium text-purple-800">
                          Выберите транспортную компанию для доставки
                        </p>
                        <p className="text-xs text-purple-700">
                          Это поле обязательно для оформления заказа
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              <TransportOptionSelector
                selectedOptions={selectedTransportOptions}
                onChange={options => {
                  setSelectedTransportOptions(options);
                  // Close editing when at least one option is selected
                  if (options.length > 0) {
                    setIsEditingTransport(false);
                  }
                }}
                initialCustomNames={{}}
              />
            </div>
          ) : selectedTransportOptions.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsEditingTransport(true)}
              className="rounded-card border-card hover:bg-card-hover w-full p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <svg
                        className="h-4 w-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">
                      Транспортные компании ({selectedTransportOptions.length})
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedTransportOptions.map(option => (
                        <span
                          key={option.id}
                          className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800"
                        >
                          {option.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <div className="rounded-card border-dashed-placeholder p-6 text-center">
              <p className="mb-3 text-gray-600">
                Транспортная компания не выбрана
              </p>
              <Button onClick={() => setIsEditingTransport(true)}>
                Выбрать компанию
              </Button>
            </div>
          )}
        </div>

        {/* Personal Data Section */}
        <div
          ref={userDataSectionRef}
          className={`rounded-card bg-card shadow-card p-6 ${validationErrors?.userData ? 'border-2 border-purple-500' : 'border-card'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Мои данные
              {validationErrors?.userData && (
                <span className="ml-2 text-sm font-medium text-purple-600">
                  (заполните обязательные поля)
                </span>
              )}
            </h2>
          </div>

          {isLoggedIn ? (
            <div className="rounded-card border-card p-4">
              {!isEditingUserData ? (
                <button
                  type="button"
                  onClick={() => setIsEditingUserData(true)}
                  className="rounded-card border-card hover:bg-card-hover w-full p-4 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <svg
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Пользователь</p>
                      {userFullName && (
                        <p className="text-sm text-gray-600">{userFullName}</p>
                      )}
                      {orderPhone && (
                        <p className="text-sm text-gray-600">{orderPhone}</p>
                      )}
                      {userEmail && (
                        <p className="text-sm text-gray-600">{userEmail}</p>
                      )}
                      {userAddress && (
                        <p className="text-sm text-gray-600">{userAddress}</p>
                      )}
                      {!userFullName &&
                        !orderPhone &&
                        !userEmail &&
                        !userAddress && (
                          <p className="text-sm text-gray-500">
                            Нажмите для заполнения данных
                          </p>
                        )}
                    </div>
                    <div className="text-right">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  {validationErrors?.userData && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="flex items-start gap-3">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="mb-2 text-sm font-medium text-purple-800">
                            Заполните обязательные поля для оформления заказа
                          </p>
                          <div className="space-y-1 text-xs text-purple-700">
                            {!userFullName?.trim() && (
                              <p>• ФИО обязательно для заполнения</p>
                            )}
                            {!orderPhone?.trim() && (
                              <p>• Телефон обязателен для заполнения</p>
                            )}
                            {!userAddress?.trim() && (
                              <p>• Адрес обязателен для заполнения</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      ФИО{' '}
                      <span className="font-semibold text-purple-500">*</span>
                      {!userFullName?.trim() && validationErrors?.userData && (
                        <span className="ml-2 text-xs font-medium text-purple-600">
                          Обязательное поле
                        </span>
                      )}
                    </label>
                    <Input
                      type="text"
                      value={userFullName}
                      onChange={e => setUserFullName(e.target.value)}
                      placeholder="Иванов Иван Иванович"
                      className={`w-full ${
                        !userFullName?.trim() && validationErrors?.userData
                          ? 'border-purple-500 bg-purple-50 focus:border-purple-500 focus:ring-purple-200'
                          : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Телефон для заказа{' '}
                      <span className="font-semibold text-purple-500">*</span>
                      {!orderPhone?.trim() && validationErrors?.userData && (
                        <span className="ml-2 text-xs font-medium text-purple-600">
                          Обязательное поле
                        </span>
                      )}
                    </label>
                    <PhoneInput
                      value={orderPhone}
                      onChange={value => setOrderPhone(value)}
                      className={`w-full ${
                        !orderPhone?.trim() && validationErrors?.userData
                          ? 'border-purple-500 bg-purple-50 focus:border-purple-500 focus:ring-purple-200'
                          : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        (необязательно)
                      </span>
                    </label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Адрес{' '}
                      <span className="font-semibold text-purple-500">*</span>
                      {!userAddress?.trim() && validationErrors?.userData && (
                        <span className="ml-2 text-xs font-medium text-purple-600">
                          Обязательное поле
                        </span>
                      )}
                    </label>
                    <AddressInput
                      value={userAddress}
                      onChange={setUserAddress}
                      placeholder="Город, улица, дом, офис"
                      required
                      error={!userAddress?.trim() && validationErrors?.userData}
                      className={`w-full ${
                        !userAddress?.trim() && validationErrors?.userData
                          ? 'border-purple-500 bg-purple-50 focus:border-purple-500 focus:ring-purple-200'
                          : ''
                      }`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditingUserData(false)}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Сохранить
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingUserData(false);
                        setUserEmail('');
                        setOrderPhone('');
                        setUserFullName('');
                        setUserAddress('');
                      }}
                      variant="outline"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="rounded-card border-card hover:bg-card-hover w-full p-4 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Войти для оформления заказа
                  </p>
                  <p className="text-sm text-gray-500">
                    Нажмите для входа или регистрации
                  </p>
                </div>
                <div className="text-right">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Order Comment Section */}
        <OrderComment
          comment={orderComment}
          setComment={setOrderComment}
          isEditing={isEditingComment}
          setIsEditing={setIsEditingComment}
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
        isPlacingOrder={isPlacingOrder}
        scrollTrigger={scrollTrigger}
      />
    </div>
  );
}
