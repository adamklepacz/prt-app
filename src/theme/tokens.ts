import { Platform, TextStyle, ViewStyle } from 'react-native';

import { FrustrationLevel } from '../types';

/** Estetyka INTU: ciepły papier, grafit, szałwia, brąz; pasma kolorów jak w kartach medytacji. */
export const colors = {
  background: '#FAF8F5',
  backgroundAlt: '#F5F3EF',
  card: '#FFFFFF',
  border: '#EFECE6',
  sage: '#5E715D',
  sageSoft: '#E6EBE3',
  brown: '#8C7A6B',
  brownSoft: '#EFE8E1',
  sand: '#C9A882',
  ink: '#34506B',
  mist: '#6F93B4',
  text: '#232323',
  textMuted: '#737373',
  textOnColor: '#FFFFFF',
  overlay: 'rgba(35, 35, 35, 0.28)',
} as const;

/** Reakcje układu nerwowego – stonowane, bez alarmowej czerwieni. */
export const reactionColors: Record<FrustrationLevel, string> = {
  calm: '#7E9479',
  impatient: '#D2B27A',
  frustrated: '#B98A78',
};

export const reactionLabels: Record<FrustrationLevel, { title: string; hint: string }> = {
  calm: { title: 'Spokojna obserwacja', hint: 'rejestracja czystych danych' },
  impatient: { title: 'Zniecierpliwienie', hint: 'chęć, by ból już minął' },
  frustrated: { title: 'Walka / Frustracja', hint: 'złość, opór, lęk' },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 12, md: 20, lg: 28, xl: 36, pill: 999 } as const;

export const fonts = {
  serif: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  serifMedium: 'PlayfairDisplay_500Medium',
  // SF Pro – systemowy krój iOS
  sans: Platform.select({ ios: 'System', default: undefined }),
} as const;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 42, color: colors.text } satisfies TextStyle,
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, color: colors.text } satisfies TextStyle,
  heading: { fontFamily: fonts.serifMedium, fontSize: 20, lineHeight: 26, color: colors.text } satisfies TextStyle,
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.text } satisfies TextStyle,
  bodyMuted: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.textMuted } satisfies TextStyle,
  caption: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } satisfies TextStyle,
  label: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '500', color: colors.text } satisfies TextStyle,
};

export const shadow: ViewStyle = {
  shadowColor: '#5A4A3A',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
};

export const cardStyle: ViewStyle = {
  backgroundColor: colors.card,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.xl,
  ...shadow,
};
