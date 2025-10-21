import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceOrder: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  onPlaceOrder,
}: CheckoutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Подтверждение заказа">
      <div className="space-y-4 p-6">
        <p className="text-lg font-semibold">
          Вы уверены, что хотите оформить заказ?
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          После подтверждения заказ будет отправлен на обработку.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onPlaceOrder}>Подтвердить заказ</Button>
        </div>
      </div>
    </Modal>
  );
}
