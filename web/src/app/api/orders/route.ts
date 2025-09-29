import { NextRequest, NextResponse } from 'next/server';

import {
  handleOrderCreationError,
  validateCustomerInfo,
  validateOrderItems,
} from '@/lib/orders/orderValidation';
import { getSession } from '@/lib/server/session';
import { createOrder, getOrders } from '@/lib/services/order-creation-service';

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await getOrders(session.userId);
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
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, customerInfo } = body;

    // Validate items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.isValid) {
      return NextResponse.json(
        { error: itemsValidation.error },
        { status: 400 }
      );
    }

    // Validate customer info
    const customerValidation = validateCustomerInfo(customerInfo);
    if (!customerValidation.isValid) {
      return NextResponse.json(
        { error: customerValidation.error },
        { status: 400 }
      );
    }

    const order = await createOrder(session.userId, items, customerInfo);

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
