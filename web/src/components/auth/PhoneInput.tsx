'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Country codes with flags and Russian names
const COUNTRIES = [
  { code: '+7', flag: '🇷🇺', name: 'Россия' },
  { code: '+1', flag: '🇺🇸', name: 'США' },
  { code: '+1', flag: '🇨🇦', name: 'Канада' },
  { code: '+44', flag: '🇬🇧', name: 'Великобритания' },
  { code: '+49', flag: '🇩🇪', name: 'Германия' },
  { code: '+33', flag: '🇫🇷', name: 'Франция' },
  { code: '+39', flag: '🇮🇹', name: 'Италия' },
  { code: '+34', flag: '🇪🇸', name: 'Испания' },
  { code: '+31', flag: '🇳🇱', name: 'Нидерланды' },
  { code: '+32', flag: '🇧🇪', name: 'Бельгия' },
  { code: '+41', flag: '🇨🇭', name: 'Швейцария' },
  { code: '+43', flag: '🇦🇹', name: 'Австрия' },
  { code: '+45', flag: '🇩🇰', name: 'Дания' },
  { code: '+46', flag: '🇸🇪', name: 'Швеция' },
  { code: '+47', flag: '🇳🇴', name: 'Норвегия' },
  { code: '+48', flag: '🇵🇱', name: 'Польша' },
  { code: '+420', flag: '🇨🇿', name: 'Чехия' },
  { code: '+421', flag: '🇸🇰', name: 'Словакия' },
  { code: '+36', flag: '🇭🇺', name: 'Венгрия' },
  { code: '+40', flag: '🇷🇴', name: 'Румыния' },
  { code: '+359', flag: '🇧🇬', name: 'Болгария' },
  { code: '+385', flag: '🇭🇷', name: 'Хорватия' },
  { code: '+386', flag: '🇸🇮', name: 'Словения' },
  { code: '+372', flag: '🇪🇪', name: 'Эстония' },
  { code: '+371', flag: '🇱🇻', name: 'Латвия' },
  { code: '+370', flag: '🇱🇹', name: 'Литва' },
  { code: '+86', flag: '🇨🇳', name: 'Китай' },
  { code: '+81', flag: '🇯🇵', name: 'Япония' },
  { code: '+82', flag: '🇰🇷', name: 'Южная Корея' },
  { code: '+91', flag: '🇮🇳', name: 'Индия' },
  { code: '+61', flag: '🇦🇺', name: 'Австралия' },
  { code: '+64', flag: '🇳🇿', name: 'Новая Зеландия' },
  { code: '+55', flag: '🇧🇷', name: 'Бразилия' },
  { code: '+52', flag: '🇲🇽', name: 'Мексика' },
  { code: '+54', flag: '🇦🇷', name: 'Аргентина' },
  { code: '+56', flag: '🇨🇱', name: 'Чили' },
  { code: '+57', flag: '🇨🇴', name: 'Колумбия' },
  { code: '+51', flag: '🇵🇪', name: 'Перу' },
  { code: '+58', flag: '🇻🇪', name: 'Венесуэла' },
  { code: '+27', flag: '🇿🇦', name: 'ЮАР' },
  { code: '+20', flag: '🇪🇬', name: 'Египет' },
  { code: '+971', flag: '🇦🇪', name: 'ОАЭ' },
  { code: '+966', flag: '🇸🇦', name: 'Саудовская Аравия' },
  { code: '+90', flag: '🇹🇷', name: 'Турция' },
  { code: '+98', flag: '🇮🇷', name: 'Иран' },
  { code: '+92', flag: '🇵🇰', name: 'Пакистан' },
  { code: '+880', flag: '🇧🇩', name: 'Бангладеш' },
  { code: '+94', flag: '🇱🇰', name: 'Шри-Ланка' },
  { code: '+977', flag: '🇳🇵', name: 'Непал' },
  { code: '+975', flag: '🇧🇹', name: 'Бутан' },
  { code: '+960', flag: '🇲🇻', name: 'Мальдивы' },
  { code: '+65', flag: '🇸🇬', name: 'Сингапур' },
  { code: '+60', flag: '🇲🇾', name: 'Малайзия' },
  { code: '+66', flag: '🇹🇭', name: 'Таиланд' },
  { code: '+84', flag: '🇻🇳', name: 'Вьетнам' },
  { code: '+63', flag: '🇵🇭', name: 'Филиппины' },
  { code: '+62', flag: '🇮🇩', name: 'Индонезия' },
  { code: '+855', flag: '🇰🇭', name: 'Камбоджа' },
  { code: '+856', flag: '🇱🇦', name: 'Лаос' },
  { code: '+95', flag: '🇲🇲', name: 'Мьянма' },
  { code: '+93', flag: '🇦🇫', name: 'Афганистан' },
  { code: '+998', flag: '🇺🇿', name: 'Узбекистан' },
  { code: '+996', flag: '🇰🇬', name: 'Кыргызстан' },
  { code: '+992', flag: '🇹🇯', name: 'Таджикистан' },
  { code: '+993', flag: '🇹🇲', name: 'Туркменистан' },
  { code: '+994', flag: '🇦🇿', name: 'Азербайджан' },
  { code: '+374', flag: '🇦🇲', name: 'Армения' },
  { code: '+995', flag: '🇬🇪', name: 'Грузия' },
  { code: '+373', flag: '🇲🇩', name: 'Молдова' },
  { code: '+380', flag: '🇺🇦', name: 'Украина' },
  { code: '+375', flag: '🇧🇾', name: 'Беларусь' },
  { code: '+358', flag: '🇫🇮', name: 'Финляндия' },
  { code: '+353', flag: '🇮🇪', name: 'Ирландия' },
  { code: '+351', flag: '🇵🇹', name: 'Португалия' },
  { code: '+30', flag: '🇬🇷', name: 'Греция' },
  { code: '+357', flag: '🇨🇾', name: 'Кипр' },
  { code: '+356', flag: '🇲🇹', name: 'Мальта' },
  { code: '+352', flag: '🇱🇺', name: 'Люксембург' },
  { code: '+377', flag: '🇲🇨', name: 'Монако' },
  { code: '+378', flag: '🇸🇲', name: 'Сан-Марино' },
  { code: '+39', flag: '🇻🇦', name: 'Ватикан' },
  { code: '+423', flag: '🇱🇮', name: 'Лихтенштейн' },
  { code: '+389', flag: '🇲🇰', name: 'Северная Македония' },
  { code: '+382', flag: '🇲🇪', name: 'Черногория' },
  { code: '+387', flag: '🇧🇦', name: 'Босния и Герцеговина' },
  { code: '+381', flag: '🇷🇸', name: 'Сербия' },
  { code: '+383', flag: '🇽🇰', name: 'Косово' },
  { code: '+355', flag: '🇦🇱', name: 'Албания' },
];

export function PhoneInput({
  value,
  onChange,
  placeholder = '+7 000 000-00-00',
  disabled = false,
  className = '',
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Auto-detect country from input
  useEffect(() => {
    if (value) {
      setInputValue(value);
      // Find country by matching the beginning of the value
      const detectedCountry = COUNTRIES.find(country =>
        value.startsWith(country.code)
      );
      if (detectedCountry && detectedCountry.code !== selectedCountry.code) {
        setSelectedCountry(detectedCountry);
        const phoneOnly = value.replace(detectedCountry.code, '').trim();
        setPhoneNumber(phoneOnly);
      }
    } else {
      setInputValue('');
    }
  }, [value, selectedCountry.code]);

  const handleCountrySelect = (country: (typeof COUNTRIES)[0]) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    const fullNumber = country.code + phoneNumber;
    setInputValue(fullNumber);
    onChange(fullNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);

    // If input is empty, clear everything
    if (input === '') {
      setPhoneNumber('');
      onChange('');
      return;
    }

    // Allow typing + at the beginning for auto-detection
    if (input.startsWith('+')) {
      // Only auto-detect if there's more than just "+"
      if (input.length > 1) {
        // Try to auto-detect country
        const detectedCountry = COUNTRIES.find(country =>
          input.startsWith(country.code)
        );
        if (detectedCountry) {
          setSelectedCountry(detectedCountry);
          const phoneOnly = input.replace(detectedCountry.code, '').trim();
          setPhoneNumber(phoneOnly);
          onChange(input);
          return;
        } else {
          // No country detected, keep the input as is but don't change selected country
          setPhoneNumber('');
          onChange(input);
          return;
        }
      }
      // If + is typed but no country detected, just pass it through
      setPhoneNumber(input);
      onChange(input);
      return;
    }

    // Check if input starts with just a number (like "7" for Russia)
    if (input.length === 1 && /^\d$/.test(input)) {
      // Try to find country that starts with this number
      const detectedCountry = COUNTRIES.find(
        country => country.code === `+${input}`
      );
      if (detectedCountry) {
        setSelectedCountry(detectedCountry);
        setPhoneNumber('');
        onChange(detectedCountry.code);
        return;
      }
    }

    // Check if user is trying to change country code by typing a different one
    const currentCountryCode = selectedCountry.code;
    if (input.length >= 2 && !input.startsWith(currentCountryCode)) {
      // User is typing a different country code
      const detectedCountry = COUNTRIES.find(country =>
        input.startsWith(country.code)
      );
      if (detectedCountry) {
        setSelectedCountry(detectedCountry);
        const phoneOnly = input.replace(detectedCountry.code, '').trim();
        setPhoneNumber(phoneOnly);
        onChange(input);
        return;
      }
    }

    // Handle individual digit deletion of country code
    if (input.length < selectedCountry.code.length) {
      // User is deleting digits from country code
      const detectedCountry = COUNTRIES.find(country =>
        input.startsWith(country.code)
      );
      if (detectedCountry) {
        setSelectedCountry(detectedCountry);
        const phoneOnly = input.replace(detectedCountry.code, '').trim();
        setPhoneNumber(phoneOnly);
        onChange(input);
        return;
      } else {
        // No country detected, clear everything
        setPhoneNumber('');
        onChange('');
        return;
      }
    }

    // Regular phone number input - extract phone number from full input
    const phoneOnly = input.substring(selectedCountry.code.length);
    const numericInput = phoneOnly.replace(/\D/g, '');
    setPhoneNumber(numericInput);
    const fullNumber = selectedCountry.code + numericInput;
    onChange(fullNumber);
  };

  const getPlaceholderForCountry = (countryCode: string) => {
    switch (countryCode) {
      case '+7': // Russia
        return '000 000-00-00';
      case '+1': // USA/Canada
        return '(000) 000-0000';
      case '+44': // UK
        return '0000 000000';
      case '+49': // Germany
        return '000 000 000';
      case '+33': // France
        return '0 00 00 00 00';
      case '+39': // Italy
        return '000 000 000';
      case '+86': // China
        return '000 0000 0000';
      case '+81': // Japan
        return '00-0000-0000';
      case '+82': // South Korea
        return '00-0000-0000';
      case '+91': // India
        return '00000 00000';
      case '+992': // Tajikistan
        return '00 000-0000';
      default:
        return '000 000 000';
    }
  };

  const formatPhoneNumber = (number: string) => {
    // If the number starts with +, handle it specially
    if (number.startsWith('+')) {
      return number;
    }

    // Remove country code from the number
    const withoutCountryCode = number.replace(selectedCountry.code, '').trim();
    const numeric = withoutCountryCode.replace(/\D/g, '');

    if (numeric.length === 0) return '';

    // Apply country-specific formatting
    switch (selectedCountry.code) {
      case '+7': // Russia
        if (numeric.length <= 3) return numeric;
        if (numeric.length <= 6)
          return `${numeric.slice(0, 3)} ${numeric.slice(3)}`;
        return `${numeric.slice(0, 3)} ${numeric.slice(3, 6)}-${numeric.slice(6, 8)}-${numeric.slice(8, 10)}`;
      case '+1': // USA/Canada
        if (numeric.length <= 3) return numeric;
        if (numeric.length <= 6)
          return `(${numeric.slice(0, 3)}) ${numeric.slice(3)}`;
        return `(${numeric.slice(0, 3)}) ${numeric.slice(3, 6)}-${numeric.slice(6)}`;
      case '+44': // UK
        if (numeric.length <= 4) return numeric;
        if (numeric.length <= 8)
          return `${numeric.slice(0, 4)} ${numeric.slice(4)}`;
        return `${numeric.slice(0, 4)} ${numeric.slice(4, 8)} ${numeric.slice(8)}`;
      case '+49': // Germany
        if (numeric.length <= 3) return numeric;
        if (numeric.length <= 6)
          return `${numeric.slice(0, 3)} ${numeric.slice(3)}`;
        return `${numeric.slice(0, 3)} ${numeric.slice(3, 6)} ${numeric.slice(6)}`;
      case '+33': // France
        if (numeric.length <= 1) return numeric;
        if (numeric.length <= 2)
          return `${numeric.slice(0, 1)} ${numeric.slice(1)}`;
        return `${numeric.slice(0, 1)} ${numeric.slice(1, 3)} ${numeric.slice(3, 5)} ${numeric.slice(5, 7)} ${numeric.slice(7, 9)}`;
      case '+39': // Italy
        if (numeric.length <= 3) return numeric;
        if (numeric.length <= 6)
          return `${numeric.slice(0, 3)} ${numeric.slice(3)}`;
        return `${numeric.slice(0, 3)} ${numeric.slice(3, 6)} ${numeric.slice(6)}`;
      case '+86': // China
        if (numeric.length <= 3) return numeric;
        if (numeric.length <= 7)
          return `${numeric.slice(0, 3)} ${numeric.slice(3)}`;
        return `${numeric.slice(0, 3)} ${numeric.slice(3, 7)} ${numeric.slice(7)}`;
      case '+81': // Japan
        if (numeric.length <= 2) return numeric;
        if (numeric.length <= 6)
          return `${numeric.slice(0, 2)}-${numeric.slice(2)}`;
        return `${numeric.slice(0, 2)}-${numeric.slice(2, 6)}-${numeric.slice(6)}`;
      case '+82': // South Korea
        if (numeric.length <= 2) return numeric;
        if (numeric.length <= 6)
          return `${numeric.slice(0, 2)}-${numeric.slice(2)}`;
        return `${numeric.slice(0, 2)}-${numeric.slice(2, 6)}-${numeric.slice(6)}`;
      case '+91': // India
        if (numeric.length <= 5) return numeric;
        return `${numeric.slice(0, 5)} ${numeric.slice(5)}`;
      case '+992': // Tajikistan
        if (numeric.length <= 2) return numeric;
        if (numeric.length <= 5)
          return `${numeric.slice(0, 2)} ${numeric.slice(2)}`;
        return `${numeric.slice(0, 2)} ${numeric.slice(2, 5)}-${numeric.slice(5, 9)}`;
      default:
        return numeric;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Single unified input field */}
      <div
        className={`relative flex h-12 w-full items-center rounded-lg border-2 transition-all duration-200 ${
          isFocused || isDropdownOpen
            ? 'border-purple-500 ring-2 ring-purple-200'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-50' : 'bg-white'} dark:border-gray-600 dark:bg-gray-700`}
      >
        {/* Country Selector - Inside the input */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="flex h-12 items-center space-x-1 px-1 text-sm transition-colors focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 dark:text-white"
          >
            {inputValue.length === 0 ||
            inputValue === '+' ||
            (inputValue.startsWith('+') && inputValue.length === 1) ||
            (inputValue.startsWith('+') &&
              !COUNTRIES.some(country =>
                inputValue.startsWith(country.code)
              )) ? (
              // Show "no code" icon when no country code is selected
              <div className="flex items-center space-x-0.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-xs font-bold text-white">?</span>
                </div>
                <svg
                  className={`h-3 w-3 cursor-pointer text-gray-500 transition-all duration-200 hover:text-purple-500 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="flex items-center space-x-0.5">
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                  <span className="text-lg">{selectedCountry.flag}</span>
                </div>
                <svg
                  className={`h-4 w-4 cursor-pointer text-gray-500 transition-all duration-200 hover:text-purple-500 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-72 overflow-auto rounded-lg border border-gray-300 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-700">
              <div className="p-2">
                <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Код страны
                </div>
                {COUNTRIES.map((country, index) => (
                  <button
                    key={`${country.code}-${country.name}-${index}`}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 ${
                      selectedCountry.code === country.code
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                      <span className="text-sm">{country.flag}</span>
                    </div>
                    <span className="font-medium">{country.name}</span>
                    <span className="ml-auto text-gray-500 dark:text-gray-400">
                      {country.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input - Single input field with country code */}
        <input
          type="tel"
          value={inputValue}
          onChange={handlePhoneChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            inputValue.length === 0 || !inputValue.startsWith('+')
              ? 'Введите номер телефона'
              : phoneNumber.length === 0
                ? getPlaceholderForCountry(selectedCountry.code)
                : ''
          }
          disabled={disabled}
          className="h-12 flex-1 border-0 bg-transparent px-1 text-base focus:outline-none focus:ring-0"
        />
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
