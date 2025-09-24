'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useCart } from '@/contexts/CartContext';

export default function LoginPage() {
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (useOtp) {
        if (!codeSent) {
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
          return;
        }
        const resVer = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!resVer.ok)
          throw new Error((await resVer.json()).error ?? 'Неверный код');
        // Sync cart with logged-in user
        const userData = await resVer.json();
        if (userData.user?.id) {
          setUserId(userData.user.id);
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });
        if (!res.ok)
          throw new Error((await res.json()).error ?? 'Login failed');
        // Sync cart with logged-in user
        const userData = await res.json();
        if (userData.user?.id) {
          setUserId(userData.user.id);
        }
      }
      router.push('/');
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm p-6">
      <Text as="h1" className="mb-4 text-xl font-semibold">
        Вход
      </Text>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Телефон</label>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
          />
        </div>
        {useOtp ? (
          <>
            {codeSent ? (
              <div>
                <label className="mb-1 block text-sm">Код из SMS</label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                />
              </div>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? codeSent
                  ? 'Проверяем…'
                  : 'Отправляем…'
                : codeSent
                  ? 'Войти'
                  : 'Отправить код'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setUseOtp(false);
                setCode('');
                setCodeSent(false);
              }}
            >
              Войти по паролю
            </Button>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Входим…' : 'Войти'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setUseOtp(true)}
            >
              Войти по коду из SMS
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
