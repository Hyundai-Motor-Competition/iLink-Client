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

/**
 * 2차 디자인(가족 프로필 등록 · 픽업 일정 등록 1~2) 값. 시안 PNG(1170x2532, @3x)에서 픽셀로 잰 값이다.
 */
export const v2 = {
  bg: '#F0F0F0',
  ink: '#111200',
  white: '#FFFFFF',
  stepOn: '#6F6F6F',
  stepOff: '#D9D9D9',
  chip: '#DADADA',
  sub: '#5F6058',
  desc: '#7A7A7A',
  placeholder: '#B4B4B4',
  avatarEmpty: '#DCDDDF',
  /** 비활성 버튼: 흰 바탕 + #696969 글자 */
  disabledText: '#696969',
  checkOff: '#D0D0D0',
} as const;

/** Android는 assets/fonts 파일 이름으로 찾는다. */
export const pretendard = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extrabold: 'Pretendard-ExtraBold',
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
