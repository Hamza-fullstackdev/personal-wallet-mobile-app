import { Text, type TextProps, type TextStyle } from 'react-native';

import { FontSize, Fonts } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption' | 'amount';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: keyof typeof Fonts;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  color,
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const variantStyles: Record<Variant, TextStyle> = {
    display: { fontSize: FontSize.xxxl, fontFamily: Fonts.bold, color: colors.textPrimary },
    h1: { fontSize: FontSize.xxl, fontFamily: Fonts.bold, color: colors.textPrimary },
    h2: { fontSize: FontSize.xl, fontFamily: Fonts.semiBold, color: colors.textPrimary },
    h3: { fontSize: FontSize.lg, fontFamily: Fonts.semiBold, color: colors.textPrimary },
    body: { fontSize: FontSize.md, fontFamily: Fonts.regular, color: colors.textPrimary },
    label: { fontSize: FontSize.sm, fontFamily: Fonts.medium, color: colors.textSecondary },
    caption: { fontSize: FontSize.xs, fontFamily: Fonts.regular, color: colors.textMuted },
    amount: { fontSize: FontSize.md, fontFamily: Fonts.semiBold, color: colors.textPrimary },
  };

  return (
    <Text
      {...rest}
      style={[
        variantStyles[variant],
        color ? { color } : null,
        weight ? { fontFamily: Fonts[weight] } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}

export default AppText;
