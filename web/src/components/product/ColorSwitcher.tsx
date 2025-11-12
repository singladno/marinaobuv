import { getColorHex } from '@/utils/colorMapping';

type ColorOption = { color: string; imageUrl: string };

type Props = {
  options: ColorOption[];
  selectedColor: string | null;
  onSelect: (color: string) => void;
  direction?: 'row' | 'col';
  addedColors?: string[];
  showAddIndicators?: boolean;
  onAddColor?: (color: string) => void;
};

export default function ColorSwitcher({
  options,
  selectedColor,
  onSelect,
  direction = 'row',
  addedColors = [],
  showAddIndicators = false,
  onAddColor,
}: Props) {
  if (!options || options.length <= 1) return null;

  const dirClass = direction === 'col' ? 'flex-col' : 'flex-row flex-wrap';

  return (
    <div className={`flex ${dirClass} items-center gap-3`}>
      {options.map(opt => {
        const isSelected =
          selectedColor?.toLowerCase() === opt.color.toLowerCase();
        const bg = getColorHex(opt.color);
        const isAdded = addedColors.some(
          c => c && c.toLowerCase() === opt.color.toLowerCase()
        );
        return (
          <button
            key={opt.color}
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(opt.color);
            }}
            title={`Цвет: ${opt.color}`}
            aria-label={`Цвет: ${opt.color}`}
            className={`hover:ring-foreground/10 relative inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-shadow transition-transform duration-150 hover:scale-105 hover:ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
              isSelected
                ? 'border-purple-400 ring-1 ring-purple-300'
                : 'border-muted'
            }`}
          >
            <span
              aria-hidden
              className="block h-4 w-4 rounded-full"
              // eslint-disable-next-line @next/next/no-css-tags
              style={{ backgroundColor: bg }}
            />
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
        );
      })}
    </div>
  );
}
