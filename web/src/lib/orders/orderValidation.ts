interface OrderItem {
  productId: string;
  quantity: number;
  [key: string]: unknown;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  [key: string]: unknown;
}

export function validateOrderItems(items: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      isValid: false,
      error: 'Items are required',
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
    !('name' in customerInfo) ||
    !('phone' in customerInfo) ||
    !('address' in customerInfo) ||
    !customerInfo.name ||
    !customerInfo.phone ||
    !customerInfo.address
  ) {
    return {
      isValid: false,
      error: 'Customer information is required',
    };
  }

  return { isValid: true };
}

export function handleOrderCreationError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Error) {
    if (error.message === 'Some products not found') {
      return { status: 404, message: error.message };
    }
  }

  return { status: 500, message: 'Internal server error' };
}
