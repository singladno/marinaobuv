import { NextRequest, NextResponse } from 'next/server';

import {
  handleOrderCreationError,
  validateCustomerInfo,
  validateOrderItems,
  validateTransportCompanyId,
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
    // Accept flat payload fields and keep backwards compatibility with customerInfo
    const {
      items,
      phone,
      fullName,
      address,
      comment,
      transportCompanyId,
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

    // Validate required transport company id
    const transportValidation = validateTransportCompanyId(transportCompanyId);
    if (!transportValidation.isValid) {
      return NextResponse.json(
        { error: transportValidation.error },
        { status: 400 }
      );
    }

    const order = await createOrder(
      session.userId,
      items,
      {
        name: fullName ?? customerInfo?.name,
        phone: phone ?? customerInfo?.phone,
        address: address ?? customerInfo?.address,
        comment: comment ?? customerInfo?.comment,
      },
      String(transportCompanyId)
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
