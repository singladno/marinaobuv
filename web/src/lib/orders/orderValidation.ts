interface OrderItem {
  productId: string;
  quantity: number;
  [key: string]: unknown;
}

interface CustomerInfo {
  name?: string;
  phone: string;
  address?: string;
  [key: string]: unknown;
}

export function validateOrderItems(items: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      isValid: false,
      error: 'Не выбраны товары',
    };
  }

  return { isValid: true };
}

export function validateCustomerInfo(customerInfo: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (
    !customerInfo ||
    typeof customerInfo !== 'object' ||
    !('phone' in customerInfo) ||
    !(customerInfo as CustomerInfo).phone
  ) {
    return {
      isValid: false,
      error: 'Укажите номер телефона',
    };
  }

  return { isValid: true };
}

export function validateTransportCompanyId(transportCompanyId: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (
    !transportCompanyId ||
    (typeof transportCompanyId !== 'string' &&
      typeof transportCompanyId !== 'number')
  ) {
    return { isValid: false, error: 'Выберите транспортную компанию' };
  }
  return { isValid: true };
}

export function handleOrderCreationError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Error) {
    if (error.message === 'Some products not found') {
      return { status: 404, message: 'Некоторые товары не найдены' };
    }
  }

  return { status: 500, message: 'Внутренняя ошибка сервера' };
}
