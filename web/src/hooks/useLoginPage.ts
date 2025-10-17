import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCart } from '@/contexts/CartContext';
import { useUser } from '@/contexts/UserContext';

export function useLoginPage(options: { disableRedirect?: boolean } = {}) {
  const router = useRouter();
  const { setUserId } = useCart();
  const { refreshUser } = useUser();

  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.status === 401) {
          // User is not authenticated, stay on login page
          return;
        }
        if (!res.ok) return; // API might be unavailable; skip redirect

        const json = await res.json();
        if (json?.user && !options.disableRedirect) {
          // User is authenticated, redirect to home or intended page
          const urlParams = new URLSearchParams(window.location.search);
          const redirectParam = urlParams.get('redirect');
          router.replace(redirectParam || '/');
        }
      } catch {
        // Network/permission error; ignore to allow login page to render
      }
    })();
  }, [router, options.disableRedirect]);

  const handleOtpRequest = async () => {
    const resReq = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!resReq.ok)
      throw new Error(
        (await resReq.json()).error ?? 'Не удалось отправить код'
      );
    setCodeSent(true);
  };

  const handleOtpVerification = async () => {
    const resVer = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!resVer.ok)
      throw new Error((await resVer.json()).error ?? 'Неверный код');
    const data = await resVer.json();
    setUserId(data.user.id);
    // Refresh user data in global context
    await refreshUser();
    router.replace('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!codeSent) {
        await handleOtpRequest();
        return;
      }
      await handleOtpVerification();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? 'Не удалось отправить код');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setCodeSent(false);
    setCode('');
    setError(null);
  };

  return {
    // State
    phone,
    codeSent,
    code,
    error,
    loading,

    // Actions
    setPhone,
    setCode,
    handleSubmit,
    handleOtpResend,
    handleBackToPhone,
  };
}
