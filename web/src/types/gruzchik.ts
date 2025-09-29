export type GruzchikOrderItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  itemCode: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    article: string | null;
    image: string | null;
  };
  // WhatsApp message info
  messageId?: string;
  messageText?: string;
  messageDate?: string;
};

export type GruzchikOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  fullName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  transportId: string | null;
  transportName: string | null;
  subtotal: number;
  total: number;
  status: string;
  label: string | null;
  payment: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
  items: GruzchikOrderItem[];
};

// Flattened structure where each row represents an order item
export type GruzchikOrderItemRow = {
  // Order info
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  orderLabel: string | null;
  orderPayment: number;
  orderTotal: number;

  // Customer info
  customerName: string | null;
  customerPhone: string;

  // Item info
  itemId: string;
  itemName: string;
  itemArticle: string | null;
  itemQty: number;
  itemPrice: number;
  itemCode: string | null;
  itemImage: string | null;

  // WhatsApp message info
  messageId?: string;
  messageText?: string;
  messageDate?: string;
};
