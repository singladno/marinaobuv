'use client';

import * as React from 'react';
import {
  ShoppingBagIcon,
  SparklesIcon,
  UserGroupIcon,
  HomeIcon,
  HeartIcon,
  GiftIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  CameraIcon,
  CpuChipIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  FireIcon,
  GlobeAltIcon,
  HandRaisedIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  ScissorsIcon,
  ShoppingCartIcon,
  StarIcon,
  SunIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  CakeIcon,
  ClockIcon,
  CloudIcon,
  ComputerDesktopIcon,
  FaceSmileIcon,
  FilmIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PhotoIcon,
  PlayIcon,
  PlusCircleIcon,
  RectangleStackIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  TagIcon,
  TrophyIcon,
  UserIcon,
  WalletIcon,
  BanknotesIcon,
  BellIcon,
  BoltIcon,
  ChartBarIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  CursorArrowRaysIcon,
  EnvelopeIcon,
  EyeIcon,
  FlagIcon,
  FolderIcon,
  HashtagIcon,
  IdentificationIcon,
  InboxIcon,
  LinkIcon,
  ListBulletIcon,
  LockClosedIcon,
  MoonIcon,
  NewspaperIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PhoneIcon,
  PresentationChartLineIcon,
  QrCodeIcon,
  RectangleGroupIcon,
  ServerIcon,
  Square3Stack3DIcon,
  SwatchIcon,
  TableCellsIcon,
  TicketIcon,
  VideoCameraIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import {
  FaShoePrints,
  FaTshirt,
  FaUtensils,
  FaDumbbell,
  FaPalette,
  FaBaby,
  FaBicycle,
  FaCar,
  FaGamepad,
  FaHeadphones,
  FaLaptop,
  FaMobile,
  FaMusic,
  FaPlane,
  FaRunning,
  FaSwimmingPool,
  FaTree,
  FaUmbrellaBeach,
  FaLeaf,
} from 'react-icons/fa';
import { GiFlowerPot } from 'react-icons/gi';

export type CategoryIconName =
  | 'shopping-bag'
  | 'sparkles'
  | 'user-group'
  | 'shoe-prints'
  | 'home'
  | 'heart'
  | 'gift'
  | 'building'
  | 'briefcase'
  | 'academic-cap'
  | 'beaker'
  | 'book'
  | 'camera'
  | 'car'
  | 'cpu-chip'
  | 'cube'
  | 'phone'
  | 'fire'
  | 'globe'
  | 'hand-raised'
  | 'light-bulb'
  | 'musical-note'
  | 'paint-brush'
  | 'puzzle-piece'
  | 'scissors'
  | 'shopping-cart'
  | 'star'
  | 'sun'
  | 'truck'
  | 'wrench'
  | 'health'
  | 'tshirt'
  | 'utensils'
  | 'dumbbell'
  | 'palette'
  | 'flower'
  | 'leaf'
  | 'cake'
  | 'clock'
  | 'cloud'
  | 'computer'
  | 'face-smile'
  | 'film'
  | 'gamepad'
  | 'key'
  | 'magnifying-glass'
  | 'map-pin'
  | 'paper-airplane'
  | 'pencil'
  | 'photo'
  | 'play'
  | 'plus-circle'
  | 'rectangle-stack'
  | 'rocket'
  | 'shield-check'
  | 'squares-2x2'
  | 'tag'
  | 'trophy'
  | 'user'
  | 'wallet'
  | 'banknotes'
  | 'bell'
  | 'bolt'
  | 'chart-bar'
  | 'circle-stack'
  | 'cog'
  | 'command-line'
  | 'cursor-arrow-rays'
  | 'envelope'
  | 'eye'
  | 'flag'
  | 'folder'
  | 'hashtag'
  | 'identification'
  | 'inbox'
  | 'link'
  | 'list-bullet'
  | 'lock'
  | 'moon'
  | 'newspaper'
  | 'paper-clip'
  | 'pencil-square'
  | 'presentation-chart'
  | 'qr-code'
  | 'rectangle-group'
  | 'server'
  | 'square-3-stack'
  | 'swatch'
  | 'table-cells'
  | 'ticket'
  | 'video-camera'
  | 'wifi'
  | 'baby'
  | 'bicycle'
  | 'gamepad-alt'
  | 'headphones'
  | 'laptop'
  | 'mobile'
  | 'music'
  | 'plane'
  | 'running'
  | 'swimming-pool'
  | 'tree'
  | 'umbrella-beach'
  | null;

interface CategoryIconSelectorProps {
  value: CategoryIconName;
  onChange: (icon: CategoryIconName) => void;
  disabled?: boolean;
}

const iconMap: Record<
  NonNullable<CategoryIconName>,
  React.ComponentType<{ className?: string }>
> = {
  'shopping-bag': ShoppingBagIcon,
  sparkles: SparklesIcon,
  'user-group': UserGroupIcon,
  'shoe-prints': FaShoePrints,
  home: HomeIcon,
  heart: HeartIcon,
  gift: GiftIcon,
  building: BuildingOfficeIcon,
  briefcase: BriefcaseIcon,
  'academic-cap': AcademicCapIcon,
  beaker: BeakerIcon,
  book: BookOpenIcon,
  camera: CameraIcon,
  car: TruckIcon,
  'cpu-chip': CpuChipIcon,
  cube: CubeIcon,
  phone: DevicePhoneMobileIcon,
  fire: FireIcon,
  globe: GlobeAltIcon,
  'hand-raised': HandRaisedIcon,
  'light-bulb': LightBulbIcon,
  'musical-note': MusicalNoteIcon,
  'paint-brush': PaintBrushIcon,
  'puzzle-piece': PuzzlePieceIcon,
  scissors: ScissorsIcon,
  'shopping-cart': ShoppingCartIcon,
  star: StarIcon,
  sun: SunIcon,
  truck: TruckIcon,
  wrench: WrenchScrewdriverIcon,
  health: HeartIcon,
  tshirt: FaTshirt,
  utensils: FaUtensils,
  dumbbell: FaDumbbell,
  palette: FaPalette,
  flower: GiFlowerPot,
  leaf: FaLeaf,
  cake: CakeIcon,
  clock: ClockIcon,
  cloud: CloudIcon,
  computer: ComputerDesktopIcon,
  'face-smile': FaceSmileIcon,
  film: FilmIcon,
  gamepad: FaGamepad,
  key: KeyIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  'map-pin': MapPinIcon,
  'paper-airplane': PaperAirplaneIcon,
  pencil: PencilIcon,
  photo: PhotoIcon,
  play: PlayIcon,
  'plus-circle': PlusCircleIcon,
  'rectangle-stack': RectangleStackIcon,
  rocket: RocketLaunchIcon,
  'shield-check': ShieldCheckIcon,
  'squares-2x2': Squares2X2Icon,
  tag: TagIcon,
  trophy: TrophyIcon,
  user: UserIcon,
  wallet: WalletIcon,
  banknotes: BanknotesIcon,
  bell: BellIcon,
  bolt: BoltIcon,
  'chart-bar': ChartBarIcon,
  'circle-stack': CircleStackIcon,
  cog: Cog6ToothIcon,
  'command-line': CommandLineIcon,
  'cursor-arrow-rays': CursorArrowRaysIcon,
  envelope: EnvelopeIcon,
  eye: EyeIcon,
  flag: FlagIcon,
  folder: FolderIcon,
  hashtag: HashtagIcon,
  identification: IdentificationIcon,
  inbox: InboxIcon,
  link: LinkIcon,
  'list-bullet': ListBulletIcon,
  lock: LockClosedIcon,
  moon: MoonIcon,
  newspaper: NewspaperIcon,
  'paper-clip': PaperClipIcon,
  'pencil-square': PencilSquareIcon,
  'presentation-chart': PresentationChartLineIcon,
  'qr-code': QrCodeIcon,
  'rectangle-group': RectangleGroupIcon,
  server: ServerIcon,
  'square-3-stack': Square3Stack3DIcon,
  swatch: SwatchIcon,
  'table-cells': TableCellsIcon,
  ticket: TicketIcon,
  'video-camera': VideoCameraIcon,
  wifi: WifiIcon,
  baby: FaBaby,
  bicycle: FaBicycle,
  'gamepad-alt': FaGamepad,
  headphones: FaHeadphones,
  laptop: FaLaptop,
  mobile: FaMobile,
  music: FaMusic,
  plane: FaPlane,
  running: FaRunning,
  'swimming-pool': FaSwimmingPool,
  tree: FaTree,
  'umbrella-beach': FaUmbrellaBeach,
};

const iconLabels: Record<NonNullable<CategoryIconName>, string> = {
  'shopping-bag': 'Сумка',
  sparkles: 'Аксессуары',
  'user-group': 'Люди',
  'shoe-prints': 'Обувь',
  home: 'Дом',
  heart: 'Сердце',
  gift: 'Подарок',
  building: 'Здание',
  briefcase: 'Портфель',
  'academic-cap': 'Образование',
  beaker: 'Химия',
  book: 'Книга',
  camera: 'Камера',
  car: 'Авто',
  'cpu-chip': 'Электроника',
  cube: 'Коробка',
  phone: 'Телефон',
  fire: 'Огонь',
  globe: 'Глобус',
  'hand-raised': 'Рука',
  'light-bulb': 'Лампочка',
  'musical-note': 'Музыка',
  'paint-brush': 'Кисть',
  'puzzle-piece': 'Пазл',
  scissors: 'Ножницы',
  'shopping-cart': 'Корзина',
  star: 'Звезда',
  sun: 'Солнце',
  truck: 'Грузовик',
  wrench: 'Инструмент',
  health: 'Здоровье',
  tshirt: 'Одежда',
  utensils: 'Кухня',
  dumbbell: 'Спорт',
  palette: 'Краски',
  flower: 'Цветы',
  leaf: 'Растения',
  cake: 'Торты',
  clock: 'Часы',
  cloud: 'Облако',
  computer: 'Компьютер',
  'face-smile': 'Смайлик',
  film: 'Фильм',
  gamepad: 'Игры',
  key: 'Ключ',
  'magnifying-glass': 'Поиск',
  'map-pin': 'Место',
  'paper-airplane': 'Самолёт',
  pencil: 'Карандаш',
  photo: 'Фото',
  play: 'Воспроизведение',
  'plus-circle': 'Плюс',
  'rectangle-stack': 'Стопка',
  rocket: 'Ракета',
  'shield-check': 'Защита',
  'squares-2x2': 'Сетка',
  tag: 'Тег',
  trophy: 'Трофей',
  user: 'Пользователь',
  wallet: 'Кошелёк',
  banknotes: 'Деньги',
  bell: 'Колокол',
  bolt: 'Молния',
  'chart-bar': 'График',
  'circle-stack': 'Круги',
  cog: 'Настройки',
  'command-line': 'Терминал',
  'cursor-arrow-rays': 'Курсор',
  envelope: 'Конверт',
  eye: 'Глаз',
  flag: 'Флаг',
  folder: 'Папка',
  hashtag: 'Хэштег',
  identification: 'ID',
  inbox: 'Входящие',
  link: 'Ссылка',
  'list-bullet': 'Список',
  lock: 'Замок',
  moon: 'Луна',
  newspaper: 'Газета',
  'paper-clip': 'Скрепка',
  'pencil-square': 'Редактировать',
  'presentation-chart': 'Презентация',
  'qr-code': 'QR-код',
  'rectangle-group': 'Группа',
  server: 'Сервер',
  'square-3-stack': 'Кубы',
  swatch: 'Палитра',
  'table-cells': 'Таблица',
  ticket: 'Билет',
  'video-camera': 'Видео',
  wifi: 'Wi-Fi',
  baby: 'Дети',
  bicycle: 'Велосипед',
  'gamepad-alt': 'Геймпад',
  headphones: 'Наушники',
  laptop: 'Ноутбук',
  mobile: 'Мобильный',
  music: 'Музыка',
  plane: 'Самолёт',
  running: 'Бег',
  'swimming-pool': 'Бассейн',
  tree: 'Дерево',
  'umbrella-beach': 'Пляж',
};

const allIcons: CategoryIconName[] = [
  'shopping-bag',
  'sparkles',
  'user-group',
  'shoe-prints',
  'home',
  'heart',
  'gift',
  'building',
  'briefcase',
  'academic-cap',
  'beaker',
  'book',
  'camera',
  'car',
  'cpu-chip',
  'cube',
  'phone',
  'fire',
  'globe',
  'hand-raised',
  'light-bulb',
  'musical-note',
  'paint-brush',
  'puzzle-piece',
  'scissors',
  'shopping-cart',
  'star',
  'sun',
  'truck',
  'wrench',
  'health',
  'tshirt',
  'utensils',
  'dumbbell',
  'palette',
  'flower',
  'leaf',
  'cake',
  'clock',
  'cloud',
  'computer',
  'face-smile',
  'film',
  'gamepad',
  'key',
  'magnifying-glass',
  'map-pin',
  'paper-airplane',
  'pencil',
  'photo',
  'play',
  'plus-circle',
  'rectangle-stack',
  'rocket',
  'shield-check',
  'squares-2x2',
  'tag',
  'trophy',
  'user',
  'wallet',
  'banknotes',
  'bell',
  'bolt',
  'chart-bar',
  'circle-stack',
  'cog',
  'command-line',
  'cursor-arrow-rays',
  'envelope',
  'eye',
  'flag',
  'folder',
  'hashtag',
  'identification',
  'inbox',
  'link',
  'list-bullet',
  'lock',
  'moon',
  'newspaper',
  'paper-clip',
  'pencil-square',
  'presentation-chart',
  'qr-code',
  'rectangle-group',
  'server',
  'square-3-stack',
  'swatch',
  'table-cells',
  'ticket',
  'video-camera',
  'wifi',
  'baby',
  'bicycle',
  'gamepad-alt',
  'headphones',
  'laptop',
  'mobile',
  'music',
  'plane',
  'running',
  'swimming-pool',
  'tree',
  'umbrella-beach',
];

export function CategoryIconSelector({
  value,
  onChange,
  disabled = false,
}: CategoryIconSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">Иконка</label>
      <div className="grid grid-cols-8 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        {/* No icon option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className={`flex h-10 w-10 items-center justify-center rounded-md border-2 transition-all hover:scale-110 ${
            value === null
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          title="Без иконки"
        >
          <span className="text-xs text-gray-400">—</span>
        </button>
        {allIcons.map(iconName => {
          // TypeScript guard: allIcons doesn't contain null, but type system thinks it might
          if (!iconName) return null;
          const IconComponent = iconMap[iconName];
          const isSelected = value === iconName;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              disabled={disabled}
              className={`flex h-10 w-10 items-center justify-center rounded-md border-2 transition-all hover:scale-110 ${
                isSelected
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              title={iconLabels[iconName]}
            >
              <IconComponent
                className={`h-5 w-5 transition-colors ${
                  isSelected
                    ? 'text-purple-600'
                    : 'text-gray-400 group-hover:text-gray-900'
                }`}
              />
            </button>
          );
        })}
      </div>
      {value && (
        <p className="text-xs text-gray-500">Выбрано: {iconLabels[value]}</p>
      )}
    </div>
  );
}

// Helper function to render icon in menu (gray by default, black on hover)
export function CategoryIcon({
  iconName,
  className = 'h-5 w-5',
}: {
  iconName: CategoryIconName;
  className?: string;
}) {
  if (!iconName) return null;
  const IconComponent = iconMap[iconName];
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={`${className} text-gray-400 transition-colors group-hover:text-black`}
    />
  );
}
