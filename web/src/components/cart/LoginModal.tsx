import { Modal } from '@/components/ui/Modal';

import { OtpInputStep } from './OtpInputStep';
import { PhoneInputStep } from './PhoneInputStep';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  setPhone: (phone: string) => void;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpSent: boolean;
  setOtpSent: (sent: boolean) => void;
  loginLoading: boolean;
  setLoginLoading: (loading: boolean) => void;
  loginError: string | null;
  setLoginError: (error: string | null) => void;
  onLogin: (phone: string, otpCode: string) => Promise<void>;
  onSendOtp: (phone: string) => Promise<void>;
}

export function LoginModal({
  isOpen,
  onClose,
  phone,
  setPhone,
  otpCode,
  setOtpCode,
  otpSent,
  setOtpSent,
  loginLoading,
  setLoginLoading,
  loginError,
  setLoginError,
  onLogin,
  onSendOtp,
}: LoginModalProps) {
  const handleSendOtp = async (phoneNumber: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await onSendOtp(phoneNumber);
      setOtpSent(true);
    } catch {
      setLoginError('Ошибка при отправке кода');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogin = async (phoneNumber: string, code: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await onLogin(phoneNumber, code);
      onClose();
    } catch {
      setLoginError('Неверный код подтверждения');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResendOtp = async (phoneNumber: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await onSendOtp(phoneNumber);
    } catch {
      setLoginError('Ошибка при повторной отправке кода');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleClose = () => {
    setOtpSent(false);
    setOtpCode('');
    setPhone('');
    setLoginError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={otpSent ? 'Подтверждение входа' : 'Вход в систему'}
      size="sm"
    >
      <div className="p-6">
        {!otpSent ? (
          <PhoneInputStep
            phone={phone}
            setPhone={setPhone}
            onSendOtp={handleSendOtp}
            loading={loginLoading}
            error={loginError}
          />
        ) : (
          <OtpInputStep
            phone={phone}
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            onLogin={handleLogin}
            onResendOtp={handleResendOtp}
            loading={loginLoading}
            error={loginError}
          />
        )}
      </div>
    </Modal>
  );
}
