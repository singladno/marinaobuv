import { NextRequest, NextResponse } from 'next/server';

import {
  handleOrderCreationError,
  validateCustomerInfo,
  validateOrderItems,
  validateTransportCompanyId,
} from '@/lib/orders/orderValidation';
import { createOrder, getOrders } from '@/lib/services/order-creation-service';
import { requireAuth } from '@/lib/server/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ['CLIENT', 'GRUZCHIK']);

    if (auth.error) {
      return auth.error;
    }

    const orders = await getOrders(auth.user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, 'CLIENT');

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();
    // Accept flat payload fields and keep backwards compatibility with customerInfo
    const {
      items,
      phone,
      fullName,
      address,
      comment,
      transportCompanyId,
      transportOptions,
      customerInfo,
    } = body;

    // Validate items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.isValid) {
      return NextResponse.json(
        { error: itemsValidation.error },
        { status: 400 }
      );
    }

    // Validate required phone (either flat or within customerInfo)
    const customerValidation = validateCustomerInfo(
      customerInfo ?? { phone, name: fullName, address, comment }
    );
    if (!customerValidation.isValid) {
      return NextResponse.json(
        { error: customerValidation.error },
        { status: 400 }
      );
    }

    // Validate required transport company id or transport options
    const transportValidation = validateTransportCompanyId(transportCompanyId);
    if (
      !transportValidation.isValid &&
      (!transportOptions || transportOptions.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Transport company or transport options are required' },
        { status: 400 }
      );
    }

    const order = await createOrder(
      auth.user.id,
      items,
      {
        name: fullName ?? customerInfo?.name,
        phone: phone ?? customerInfo?.phone,
        address: address ?? customerInfo?.address,
        comment: comment ?? customerInfo?.comment,
      },
      String(transportCompanyId),
      transportOptions
    );

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error creating order:', error);

    const { status, message } = handleOrderCreationError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
