/**
 * Portal quick-menu orbits — match site header: fuchsia → violet, white icons.
 */
/** Hover scale/shadow is driven by `PortalRadialSlots` wrapper so wedge + icon stay in sync */
const orbitBase =
  'flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ease-out ' +
  'shadow-[0_4px_20px_rgba(109,40,217,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] ' +
  'active:scale-95 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

/** Admin / export — same as primary buttons (violet-600 → violet-700); explicit white so stroked gear matches filled icons */
export const orbitIconAdmin = `${orbitBase} border-white/40 bg-gradient-to-br from-violet-600 to-violet-800 !text-white [&_svg]:!text-white [&_svg]:stroke-white`;

/** Client portal — sky accent (catalog / people) */
export const orbitIconClient = `${orbitBase} border-white/40 bg-gradient-to-br from-sky-500 to-blue-700 text-white`;

/** WhatsApp — brand green */
export const orbitIconWhatsApp = `${orbitBase} border-white/35 bg-gradient-to-br from-emerald-500 to-emerald-800 text-white`;
