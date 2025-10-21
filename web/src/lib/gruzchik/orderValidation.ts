import { prisma } from '@/lib/server/db';

export async function validateGruzchikOrderAccess(
  orderId: string,
  gruzchikId: string
): Promise<{ isValid: boolean; error?: string }> {
  const existingOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      gruzchikId,
    },
  });

  if (!existingOrder) {
    return {
      isValid: false,
      error: 'Order not found or not assigned to you',
    };
  }

  return { isValid: true };
}

export function buildOrderUpdateData(updates: {
  label?: string | null;
  payment?: number | null;
  status?: string;
}): { hasUpdates: boolean; updateData: Record<string, unknown> } {
  const updateData: Record<string, unknown> = {};

  if (updates.label !== undefined) updateData.label = updates.label;
  if (updates.payment !== undefined) updateData.payment = updates.payment;
  if (updates.status !== undefined) updateData.status = updates.status;

  return {
    hasUpdates: Object.keys(updateData).length > 0,
    updateData,
  };
}
