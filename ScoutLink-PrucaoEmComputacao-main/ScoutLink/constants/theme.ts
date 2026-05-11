/**
 * ScoutLink Design Tokens
 * Brand: Escoteiros do DF — escoteirosdf.org.br
 */

export const ScoutColors = {
  // Official Escoteiros DF Brand
  navy:        '#004176',
  navyDark:    '#002d52',
  navyLight:   '#0056a0',
  orange:      '#F15A24',
  orangeLight: '#f97c51',
  purple:      '#4B237F',
  purpleLight: '#6b3bbd',
  green:       '#006837',
  greenLight:  '#00914d',
  yellow:      '#F7C600',

  // Backgrounds (light theme)
  bgBase:    '#F2F5F7',
  bgWhite:   '#ffffff',
  bgCard:    '#ffffff',
  bgSection: '#EEF2F6',
  bgNavyTint:'#EBF2FA',

  // Borders
  borderLight:  '#DDE4EC',
  borderMedium: '#C4CEE0',
  borderNavy:   'rgba(0,65,118,0.2)',

  // Text
  textPrimary:   '#1a2533',
  textSecondary: '#4a5568',
  textMuted:     '#7A7A7A',
  textOnDark:    '#ffffff',

  // Tab bar
  tabBar:     '#004176',
  tabActive:  '#F15A24',
  tabInactive:'rgba(255,255,255,0.55)',
} as const;

// Backward compat
export const Colors = {
  light: {
    text:            ScoutColors.textPrimary,
    background:      ScoutColors.bgBase,
    tint:            ScoutColors.orange,
    icon:            ScoutColors.textSecondary,
    tabIconDefault:  ScoutColors.tabInactive,
    tabIconSelected: ScoutColors.tabActive,
  },
  dark: {
    text:            ScoutColors.textPrimary,
    background:      ScoutColors.bgBase,
    tint:            ScoutColors.orange,
    icon:            ScoutColors.textSecondary,
    tabIconDefault:  ScoutColors.tabInactive,
    tabIconSelected: ScoutColors.tabActive,
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 999,
} as const;

export const Typography = {
  title:    { fontSize: 22, fontWeight: '800' as const, color: ScoutColors.navy },
  subtitle: { fontSize: 17, fontWeight: '700' as const, color: ScoutColors.navy },
  body:     { fontSize: 14, fontWeight: '400' as const, color: ScoutColors.textSecondary },
  caption:  { fontSize: 12, fontWeight: '400' as const, color: ScoutColors.textMuted },
  label:    { fontSize: 13, fontWeight: '600' as const, color: ScoutColors.textSecondary },
} as const;
