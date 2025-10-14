import { CartItemsList } from '@/components/cart/CartItemsList';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { OrderComment } from '@/components/cart/OrderComment';
import TransportCompanySelector from '@/components/features/TransportCompanySelector';
import { popularTransportCompanies, TransportCompany } from '@/lib/shipping';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';

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
}

export function BasketContent({
  products,
  selectedTransport,
  isEditingTransport,
  setIsEditingTransport,
  selectedTransportId,
  setSelectedTransportId,
  setSelectedTransportCompany,
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
}: BasketContentProps) {
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
          className={`rounded-card bg-card shadow-card p-6 ${validationErrors?.transport ? 'border-card-error' : 'border-card'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Выбор транспортной компании
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
            <TransportCompanySelector
              value={selectedTransportId || undefined}
              initialCustomName={
                selectedTransport?.id === 'other'
                  ? selectedTransport?.name
                  : undefined
              }
              onChange={(id, company) => {
                setSelectedTransportId(id);
                if (company && setSelectedTransportCompany) {
                  setSelectedTransportCompany(company);
                }
                // Close for regular options; for "Другое" close only when a non-empty name is chosen
                if (
                  id !== 'other' ||
                  (company?.name && company.name.trim() !== '')
                ) {
                  setIsEditingTransport(false);
                }
              }}
            />
          ) : selectedTransport ? (
            <button
              type="button"
              onClick={() => setIsEditingTransport(true)}
              className="rounded-card border-card hover:bg-card-hover w-full p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center">
                    {selectedTransport.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedTransport.logoUrl}
                        alt={selectedTransport.name}
                        className="h-10 w-10 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : selectedTransport.id === 'other' ? (
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
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedTransport.name}</h3>
                    {selectedTransport.address && (
                      <p className="text-sm text-gray-600">
                        {selectedTransport.address}
                      </p>
                    )}
                    {selectedTransport.workingHours && (
                      <p className="text-sm text-gray-500">
                        {selectedTransport.workingHours}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {selectedTransport.priceLabel}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedTransport.eta}
                  </p>
                </div>
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
          className={`rounded-card bg-card shadow-card p-6 ${validationErrors?.userData ? 'border-card-error' : 'border-card'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Мои данные</h2>
            <button
              className="text-purple-600 hover:text-purple-700"
              aria-label="Редактировать данные"
              title="Редактировать данные"
              onClick={() =>
                isLoggedIn
                  ? setIsEditingUserData(!isEditingUserData)
                  : setIsLoginModalOpen(true)
              }
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

          {isLoggedIn ? (
            <div
              className={`rounded-card p-4 ${validationErrors?.userData ? 'border-card-error' : 'border-card'}`}
            >
              {!isEditingUserData ? (
                <div className="flex items-center gap-3">
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
                    <div>
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
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ФИО (необязательно)
                    </label>
                    <Input
                      type="text"
                      value={userFullName}
                      onChange={e => setUserFullName(e.target.value)}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Телефон для заказа
                    </label>
                    <PhoneInput
                      value={orderPhone}
                      onChange={value => setOrderPhone(value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email (необязательно)
                    </label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={e => setUserEmail(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Адрес (необязательно)
                    </label>
                    <Input
                      type="text"
                      value={userAddress}
                      onChange={e => setUserAddress(e.target.value)}
                      placeholder="Город, улица, дом, офис"
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
            <div>
              <p className="mb-3 text-gray-600">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="font-medium text-purple-600 hover:text-purple-700"
                >
                  Войти или зарегистрироваться
                </button>
                , чтобы оформить заказ
              </p>
            </div>
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
      />
    </div>
  );
}
