import ColorIndicator from '@/components/product/ColorIndicator';

type ColorOption = { color: string; imageUrl: string; isActive?: boolean };

type Props = {
  options: ColorOption[];
  selectedColor: string | null;
  onSelect: (color: string) => void;
  direction?: 'row' | 'col';
  addedColors?: string[];
  showAddIndicators?: boolean;
  onAddColor?: (color: string) => void;
  // Admin controls for color activation
  isAdmin?: boolean;
  productId?: string;
  onColorToggle?: (color: string, isActive: boolean) => void;
  togglingColors?: Set<string>;
  isPurchaseMode?: boolean;
};

export default function ColorSwitcher({
  options,
  selectedColor,
  onSelect,
  direction = 'row',
  addedColors = [],
  showAddIndicators = false,
  onAddColor,
  isAdmin = false,
  productId,
  onColorToggle,
  togglingColors = new Set(),
  isPurchaseMode = false,
}: Props) {
  if (!options || options.length <= 1) return null;

  const dirClass = direction === 'col' ? 'flex-col' : 'flex-row flex-wrap';

  return (
    <div className={`flex ${dirClass} items-center gap-3`}>
      {options.map((opt, index) => {
        const isSelected =
          selectedColor?.toLowerCase() === opt.color.toLowerCase();
        const isAdded = addedColors.some(
          c => c && c.toLowerCase() === opt.color.toLowerCase()
        );
        const isActive = opt.isActive !== false; // Default to true if not specified
        const isToggling = togglingColors.has(opt.color);
        // Use index in key to handle duplicate colors (shouldn't happen but prevents React errors)
        const uniqueKey = `${opt.color}-${index}-${opt.imageUrl || ''}`;
        return (
          <div key={uniqueKey} className="relative">
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(opt.color);
              }}
              onContextMenu={e => {
                if (isAdmin && productId && onColorToggle) {
                  e.preventDefault();
                  e.stopPropagation();
                  onColorToggle(opt.color, !isActive);
                }
              }}
              title={
                isAdmin && productId
                  ? `Цвет: ${opt.color} (ПКМ для ${isActive ? 'деактивации' : 'активации'})`
                  : `Цвет: ${opt.color}`
              }
              aria-label={`Цвет: ${opt.color}`}
              className={`hover:ring-foreground/10 relative inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-shadow transition-transform duration-150 hover:scale-105 hover:ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                isSelected
                  ? 'border-purple-400 ring-1 ring-purple-300'
                  : 'border-muted'
              } ${!isActive ? 'opacity-40 grayscale' : ''}`}
            >
              <ColorIndicator colorName={opt.color} size="md" />
              {showAddIndicators && !isAdded && onAddColor && (
                <span
                  className="absolute -bottom-1 -right-1 inline-flex h-4 w-4 translate-x-0.5 translate-y-0.5 items-center justify-center rounded-full bg-white shadow ring-1 ring-muted"
                >
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Добавить цвет ${opt.color}`}
                    className="flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-white shadow-sm"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddColor(opt.color);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddColor(opt.color);
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3"
                    >
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                  </span>
                </span>
              )}
            </button>
            {/* Admin toggle switch - TV style, same as main product toggle */}
            {isAdmin && productId && !isPurchaseMode && (
              <div className="absolute -top-3 -right-1 z-10">
                {isToggling ? (
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onColorToggle) {
                        onColorToggle(opt.color, !isActive);
                      }
                    }}
                    disabled={isToggling}
                    className={`group relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isActive
                        ? 'border border-purple-400/30 bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_8px_rgba(147,51,234,0.4)]'
                        : 'border border-gray-300/50 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.1)] dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-800 dark:text-gray-400'
                    }`}
                    title={isActive ? 'Деактивировать цвет' : 'Активировать цвет'}
                  >
                    {/* Power symbol - TV style, same as main toggle */}
                    <svg
                      className={`h-2.5 w-2.5 transition-all duration-200 ${
                        isActive ? 'drop-shadow-sm' : ''
                      }`}
                      viewBox="0 0 512 512"
                      fill="currentColor"
                    >
                      <path
                        d="M312.264,51.852v46.714c76.614,23.931,132.22,95.441,132.22,179.94  c0,104.097-84.387,188.484-188.484,188.484l-22.505,22.505L256,512c128.955,0,233.495-104.539,233.495-233.495  C489.495,168.95,414.037,77.034,312.264,51.852z"
                        fill="currentColor"
                      />
                      <g>
                        <path
                          d="M67.516,278.505c0-84.499,55.605-156.009,132.22-179.94V51.852   C97.963,77.034,22.505,168.95,22.505,278.505C22.505,407.461,127.045,512,256,512v-45.011   C151.903,466.989,67.516,382.602,67.516,278.505z"
                          fill="currentColor"
                        />
                        <rect
                          x="233.495"
                          width="45.011"
                          height="278.505"
                          fill="currentColor"
                        />
                      </g>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
