import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../ui';

export interface PieChartSlice {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartSlice[];
  size: number;
  donut?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export function PieChart({
  data,
  size,
  donut = false,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const { colors } = useTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 3;
  const center = size / 2;

  if (total <= 0) return null;

  let cursor = -90;
  const slices = data.map((slice) => {
    const angle = (slice.value / total) * 360;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return { ...slice, angle, start, end };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {slices.map((slice) => {
          if (slice.angle >= 359.99) {
            return (
              <Circle
                key={slice.name}
                cx={center}
                cy={center}
                r={radius}
                fill={slice.color}
                stroke={colors.surface}
                strokeWidth={1.5}
              />
            );
          }

          return (
            <Path
              key={slice.name}
              d={describeArc(center, center, radius, slice.start, slice.end)}
              fill={slice.color}
              stroke={colors.surface}
              strokeWidth={1.5}
            />
          );
        })}
        {donut ? <Circle cx={center} cy={center} r={radius * 0.58} fill={colors.surface} /> : null}
      </Svg>
      {donut ? (
        <View style={styles.center} pointerEvents="none">
          <AppText variant="caption">{centerLabel ?? 'Total'}</AppText>
          <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit style={styles.centerValue}>
            {centerValue ?? ''}
          </AppText>
        </View>
      ) : null}
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
    paddingHorizontal: '18%',
  },
  centerValue: {
    marginTop: 2,
  },
});

export default PieChart;
