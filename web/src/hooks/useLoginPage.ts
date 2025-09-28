import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCart } from '@/contexts/CartContext';

export function useLoginPage() {
  const router = useRouter();
  const { setUserId } = useCart();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [useOtp, setUseOtp] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.user) router.replace('/');
    })();
  }, [router]);

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
      body: JSON.stringify({ phone, code }),
    });
    if (!resVer.ok)
      throw new Error((await resVer.json()).error ?? 'Неверный код');
    const data = await resVer.json();
    setUserId(data.user.userId);
    router.replace('/');
  };

  const handlePasswordLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Неверные данные');
    const data = await res.json();
    setUserId(data.user.userId);
    router.replace('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (useOtp) {
        if (!codeSent) {
          await handleOtpRequest();
          return;
        }
        await handleOtpVerification();
      } else {
        await handlePasswordLogin();
      }
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
    password,
    useOtp,
    codeSent,
    code,
    error,
    loading,

    // Actions
    setPhone,
    setPassword,
    setUseOtp,
    setCode,
    handleSubmit,
    handleOtpResend,
    handleBackToPhone,
  };
}
