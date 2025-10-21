import { useState } from 'react';
import type { Notification } from '@/components/ui/NotificationProvider';
import { useUser } from '@/contexts/UserContext';

interface UseBasketPageHandlersProps {
  setLoginLoading: (loading: boolean) => void;
  setLoginError: (error: string | null) => void;
  setOtpSent: (sent: boolean) => void;
  setUserId: (id: string) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setIsLoginModalOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  phone: string;
}

export function useBasketPageHandlers({
  setLoginLoading,
  setLoginError,
  setOtpSent,
  setUserId,
  setIsLoggedIn,
  setIsLoginModalOpen,
  addNotification,
  phone,
}: UseBasketPageHandlersProps) {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const { refreshUser } = useUser();

  const handleLogin = async (phone: string, otpCode: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Не удалось войти');
      setUserId(json.user.id);
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      // Refresh user data in global context
      await refreshUser();
      addNotification({
        type: 'success',
        title: 'Успешный вход',
        message: 'Вы успешно вошли в систему.',
      });
    } catch (e: unknown) {
      const error = e as Error;
      setLoginError(error.message);
      addNotification({
        type: 'error',
        title: 'Ошибка входа',
        message: error.message,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? 'Не удалось отправить код');
      setOtpSent(true);
      addNotification({
        type: 'info',
        title: 'Код отправлен',
        message: 'Код подтверждения отправлен на ваш номер телефона.',
      });
    } catch (e: unknown) {
      const error = e as Error;
      setLoginError(error.message);
      addNotification({
        type: 'error',
        title: 'Ошибка отправки кода',
        message: error.message,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  return {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    handleLogin,
    handleRequestOtp,
  };
}
