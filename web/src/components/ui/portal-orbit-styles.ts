/**
 * Portal quick-menu orbits — match site header: fuchsia → violet, white icons.
 * Rim: stacked backgrounds (padding + border clip) instead of border+gradient to avoid circular edge seams.
 */
/** Hover scale is driven by `PortalRadialSlots` wrapper so wedge + icon stay in sync */
const orbitShell =
  'flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full ' +
  'border-2 border-transparent transition-all duration-200 ease-out shadow-none ' +
  '[background-clip:padding-box,border-box] [background-origin:border-box] ' +
  'active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

/** Admin / export — same as primary buttons (violet-600 → violet-800) */
export const orbitIconAdmin =
  `${orbitShell} ` +
  '[background-image:linear-gradient(to_bottom_right,#7c3aed,#5b21b6),linear-gradient(to_bottom_right,rgb(255_255_255/0.44),rgb(255_255_255/0.14))] ' +
  '!text-white [&_svg]:!text-white [&_svg]:stroke-white';

/** Client portal — sky accent */
export const orbitIconClient =
  `${orbitShell} ` +
  '[background-image:linear-gradient(to_bottom_right,#0ea5e9,#1d4ed8),linear-gradient(to_bottom_right,rgb(255_255_255/0.44),rgb(255_255_255/0.14))] ' +
  '!text-white [&_svg]:!text-white [&_svg]:stroke-white';

/** WhatsApp — brand green */
export const orbitIconWhatsApp =
  `${orbitShell} ` +
  '[background-image:linear-gradient(to_bottom_right,#10b981,#065f46),linear-gradient(to_bottom_right,rgb(255_255_255/0.38),rgb(255_255_255/0.12))] ' +
  'text-white';
