import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Fonts } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../ui';

interface GaugeProps {
  progress: number;
  size?: number;
  color: string;
  label: string;
  value: string;
  caption?: string;
}

export function Gauge({
  progress,
  size = 210,
  color,
  label,
  value,
  caption,
}: GaugeProps) {
  const { colors } = useTheme();
  const stroke = 16;
  const center = size / 2;
  const radius = center - stroke / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <AppText variant="caption">{label}</AppText>
        <AppText
          variant="h1"
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.value}
        >
          {value}
        </AppText>
        {caption ? (
          <AppText variant="caption" center style={styles.caption}>
            {caption}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '20%',
  },
  value: {
    fontFamily: Fonts.bold,
  },
  caption: {
    marginTop: 2,
  },
});

export default Gauge;
