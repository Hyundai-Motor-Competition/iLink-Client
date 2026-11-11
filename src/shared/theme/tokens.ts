// Figma Wireframe(부모·자녀 모바일)에서 추출한 값.
export const colors = {
  bg: '#FFFFFF',
  surface: '#F9F9F9',
  surfaceAlt: '#F2F3F5',
  text: '#181A1C',
  subText: '#75777D',
  muted: '#999DA3',
  primary: '#1040CA',
  primarySoft: '#ECF0FB',
  dark: '#2B2D33',
  danger: '#E51B1B',
  success: '#2DD554',
  border: '#E5E5E5',
  line: '#D9D9D9',
  dim: 'rgba(19,20,23,0.64)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const font = {
  hero: 28,
  title: 24,
  heading: 20,
  body: 16,
  label: 14,
  caption: 13,
  tiny: 12,
} as const;

export const radius = { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 } as const;
