import { useState, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';

export function useBasketAuth() {
  const { setUserId } = useCart();
  const { addNotification } = useNotifications();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!phone.trim()) return;

    setIsOtpSent(true);
    addNotification({
      type: 'info',
      title: 'Код отправлен',
      message: 'Проверьте SMS с кодом подтверждения',
    });
  }, [phone, addNotification]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp.trim()) return;

    setIsVerifying(true);
    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserId('user-id');
      setIsLoginModalOpen(false);
      addNotification({
        type: 'success',
        title: 'Вход выполнен',
        message: 'Вы успешно вошли в систему',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка входа',
        message: 'Неверный код подтверждения',
      });
    } finally {
      setIsVerifying(false);
    }
  }, [otp, setUserId, addNotification]);

  return {
    isLoginModalOpen,
    setIsLoginModalOpen,
    phone,
    setPhone,
    otp,
    setOtp,
    isOtpSent,
    isVerifying,
    handleLogin,
    handleVerifyOtp,
  };
}
