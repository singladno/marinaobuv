import { useState, useCallback } from 'react';

import { useNotifications } from '@/components/ui/NotificationProvider';
import { useCart } from '@/contexts/CartContext';

export function useBasketAuth() {
  const { setUserId } = useCart();
  const { addNotification } = useNotifications();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!phone.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Не удалось войти');

      setUserId(json.user.id);
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
        message:
          error instanceof Error ? error.message : 'Неверные данные для входа',
      });
    } finally {
      setIsLoggingIn(false);
    }
  }, [phone, password, setUserId, addNotification]);

  return {
    isLoginModalOpen,
    setIsLoginModalOpen,
    phone,
    setPhone,
    password,
    setPassword,
    isLoggingIn,
    handleLogin,
  };
}
