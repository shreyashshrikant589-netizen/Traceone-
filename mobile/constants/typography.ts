export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  subheading: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
} as const;

export const typographyClasses = {
  display: 'text-[32px] leading-[40px] font-bold',
  heading: 'text-2xl leading-8 font-bold',
  subheading: 'text-lg leading-7 font-semibold',
  body: 'text-base leading-6',
  label: 'text-sm leading-5 font-semibold',
  caption: 'text-xs leading-4 font-medium',
} as const;
