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

  // Normalize color names for robust matching
  const normalizeColor = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[_]/g, ' ')
      .replace(/[\s-]+/g, ' ');
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    gray: '#9CA3AF',
    grey: '#9CA3AF',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    orange: '#F97316',
    brown: '#92400E',
    // make beige darker and more saturated
    beige: '#D2B48C',
    pink: '#EC4899',
    purple: '#8B5CF6',
    violet: '#8B5CF6',
    navy: '#1E3A8A',
    tan: '#D2B48C',
    чёрный: '#000000',
    черный: '#000000',
    белый: '#FFFFFF',
    серый: '#9CA3AF',
    красный: '#EF4444',
    синий: '#3B82F6',
    голубой: '#60A5FA',
    зелёный: '#10B981',
    зеленый: '#10B981',
    жёлтый: '#F59E0B',
    желтый: '#F59E0B',
    оранжевый: '#F97316',
    коричневый: '#92400E',
    бежевый: '#D2B48C',
    розовый: '#EC4899',
    фиолетовый: '#8B5CF6',
    бордовый: '#7F1D1D',
    хаки: '#8A9A5B',
    небесный: '#60A5FA',
    молочный: '#F8FAFC',
  };

  const resolveColor = (name: string) => {
    if (!name) return '#D1D5DB';
    const n = normalizeColor(name);
    // direct map
    if (n in colorMap) return colorMap[n as keyof typeof colorMap];
    // heuristics to bring back blue variants
    if (n.includes('navy') || n.includes('blue') || n.includes('син'))
      return '#3B82F6';
    if (n.includes('голуб')) return '#60A5FA';
    if (n.includes('темно син') || n.includes('тёмно син')) return '#1E3A8A';
    return '#D1D5DB';
  };

  const dirClass = direction === 'col' ? 'flex-col' : 'flex-row flex-wrap';

  return (
    <div className={`flex ${dirClass} items-center gap-3`}>
      {options.map(opt => {
        const isSelected =
          selectedColor?.toLowerCase() === opt.color.toLowerCase();
        const bg = resolveColor(opt.color);
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
