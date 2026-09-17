import { Text, type TextProps, type TextStyle } from 'react-native';

import { Colors, FontSize, Fonts } from '../../theme';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption' | 'amount';

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: keyof typeof Fonts;
  center?: boolean;
}

const VARIANT_STYLES: Record<Variant, TextStyle> = {
  display: { fontSize: FontSize.xxxl, fontFamily: Fonts.bold, color: Colors.textPrimary },
  h1: { fontSize: FontSize.xxl, fontFamily: Fonts.bold, color: Colors.textPrimary },
  h2: { fontSize: FontSize.xl, fontFamily: Fonts.semiBold, color: Colors.textPrimary },
  h3: { fontSize: FontSize.lg, fontFamily: Fonts.semiBold, color: Colors.textPrimary },
  body: { fontSize: FontSize.md, fontFamily: Fonts.regular, color: Colors.textPrimary },
  label: { fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.textSecondary },
  caption: { fontSize: FontSize.xs, fontFamily: Fonts.regular, color: Colors.textMuted },
  amount: { fontSize: FontSize.md, fontFamily: Fonts.semiBold, color: Colors.textPrimary },
};

export function AppText({
  variant = 'body',
  color,
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        VARIANT_STYLES[variant],
        color ? { color } : null,
        weight ? { fontFamily: Fonts[weight] } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}

export default AppText;
