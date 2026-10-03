// Shared animation tokens, easings, and Framer Motion variants

export const EASE_OUT    = [0.23, 1, 0.32, 1] as const;
export const EASE_INOUT  = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const MODAL_ENTRY = {
  initial: { opacity: 0, scale: 0.96 as number, y: 14 as number },
  animate: { opacity: 1, scale: 1   as number, y: 0  as number },
  exit:    { opacity: 0, scale: 0.96 as number, y: 14 as number },
  transition: { duration: 0.28, ease: EASE_OUT },
} as const;

export const FADE_UP = {
  initial:    { opacity: 0, y: 12 as number },
  animate:    { opacity: 1, y: 0  as number },
  exit:       { opacity: 0, y: -8 as number },
  transition: { duration: 0.22, ease: EASE_OUT },
} as const;

// Stagger list items — use `animate="visible"` on parent with staggerChildren
export const LIST_CONTAINER = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055 } },
} as const;

export const LIST_ITEM = {
  hidden:  { opacity: 0, y: 10 as number },
  visible: { opacity: 1, y: 0  as number },
} as const;

// Gacha card entrance config keyed by rarity
export const RARITY_CARD = {
  Comum: {
    initial:   { opacity: 0, scale: 0.85 as number },
    animate:   { opacity: 1, scale: 1    as number },
    duration:  0.22,
    hasGlow:   false,
    glowColor: null as string | null,
  },
  Incomum: {
    initial:   { opacity: 0, scale: 0.85 as number },
    animate:   { opacity: 1, scale: 1    as number },
    duration:  0.24,
    hasGlow:   false,
    glowColor: null as string | null,
  },
  Raro: {
    initial:   { opacity: 0, scale: 0.82 as number },
    animate:   { opacity: 1, scale: 1    as number },
    duration:  0.28,
    hasGlow:   false,
    glowColor: null as string | null,
  },
  Épico: {
    initial:   { opacity: 0, scale: 0.78 as number, y: 5 as number },
    animate:   { opacity: 1, scale: 1    as number, y: 0 as number },
    duration:  0.34,
    hasGlow:   false,
    glowColor: null as string | null,
  },
  Lendário: {
    initial:   { opacity: 0, scale: 0.65 as number, filter: 'brightness(2.2)' },
    animate:   { opacity: 1, scale: 1    as number, filter: 'brightness(1)'   },
    duration:  0.44,
    hasGlow:   true,
    glowColor: 'rgba(200,155,60,0.55)' as string | null,
  },
  Mítico: {
    initial:   { opacity: 0, scale: 0.58 as number, filter: 'brightness(3)'       },
    animate:   { opacity: 1, scale: 1    as number, filter: 'brightness(1)'       },
    duration:  0.50,
    hasGlow:   true,
    glowColor: 'rgba(255,80,80,0.55)' as string | null,
  },
  Divino: {
    initial:   { opacity: 0, scale: 0.50 as number, filter: 'brightness(4) saturate(0)' },
    animate:   { opacity: 1, scale: 1    as number, filter: 'brightness(1) saturate(1)' },
    duration:  0.58,
    hasGlow:   true,
    glowColor: 'rgba(255,255,200,0.65)' as string | null,
  },
} as const;
