interface LoginMethodToggleProps {
  useOtp: boolean;
  setUseOtp: (useOtp: boolean) => void;
}

export function LoginMethodToggle({
  useOtp,
  setUseOtp,
}: LoginMethodToggleProps) {
  return (
    <div className="flex items-center justify-center space-x-4">
      <button
        type="button"
        onClick={() => setUseOtp(true)}
        className={`rounded-md px-4 py-2 text-sm font-medium ${
          useOtp
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        SMS код
      </button>
      <button
        type="button"
        onClick={() => setUseOtp(false)}
        className={`rounded-md px-4 py-2 text-sm font-medium ${
          !useOtp
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        Пароль
      </button>
    </div>
  );
}
