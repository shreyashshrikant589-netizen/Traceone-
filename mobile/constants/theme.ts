import { colors } from './Colors';
import { spacing, spacingClasses } from './spacing';
import { typography, typographyClasses } from './typography';

export { colors, spacing, spacingClasses, typography, typographyClasses };

export const radii = {
  small: 8,
  medium: 12,
  large: 16,
  pill: 999,
} as const;

export const theme = {
  colors,
  spacing,
  typography,
  radii,
  surfaces: {
    screen: 'bg-background',
    muted: 'bg-background-muted',
    card: 'bg-surface border border-border rounded-xl shadow-sm',
  },
  text: {
    primary: 'text-navy',
    secondary: 'text-muted',
    inverse: 'text-white',
    link: 'text-blue',
  },
  controls: {
    primary: 'bg-blue active:bg-blue-light',
    secondary: 'bg-teal active:bg-teal-light',
    outline: 'border border-border bg-surface active:bg-background-muted',
  },
} as const;
