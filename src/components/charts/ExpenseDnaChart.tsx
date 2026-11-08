import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';

export interface ExpenseDnaGene {
  name: string;
  value: number;
  color: string;
}

interface ExpenseDnaChartProps {
  data: ExpenseDnaGene[];
  height?: number;
}

const PADDING = 18;
const AMPLITUDE = 34;
const CYCLES = 2.4;
const SAMPLES = 100;

function strandPath(
  upper: boolean,
  width: number,
  height: number,
): string {
  const centerY = height / 2;
  const plotWidth = Math.max(0, width - PADDING * 2);
  const points: string[] = [];
  for (let index = 0; index <= SAMPLES; index += 1) {
    const ratio = index / SAMPLES;
    const x = PADDING + ratio * plotWidth;
    const phase = ratio * Math.PI * 2 * CYCLES;
    const offset = Math.sin(phase) * AMPLITUDE * (upper ? -1 : 1);
    points.push(`${index === 0 ? 'M' : 'L'} ${x} ${centerY + offset}`);
  }
  return points.join(' ');
}

export function ExpenseDnaChart({ data, height = 190 }: ExpenseDnaChartProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const maxValue = Math.max(1, ...data.map((gene) => gene.value));
  const centerY = height / 2;
  const plotWidth = Math.max(0, width - PADDING * 2);
  const count = data.length;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height }}
    >
      {width > 0 && count > 0 ? (
        <Svg width={width} height={height}>
          <Path
            d={strandPath(true, width, height)}
            stroke={colors.primary}
            strokeWidth={3}
            strokeOpacity={0.35}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={strandPath(false, width, height)}
            stroke={colors.primaryLight}
            strokeWidth={3}
            strokeOpacity={0.35}
            fill="none"
            strokeLinecap="round"
          />

          {data.map((gene, index) => {
            const ratio = count <= 1 ? 0.5 : index / (count - 1);
            const x = PADDING + ratio * plotWidth;
            const phase = ratio * Math.PI * 2 * CYCLES;
            const sin = Math.sin(phase);
            const upperY = centerY - sin * AMPLITUDE;
            const lowerY = centerY + sin * AMPLITUDE;
            const strength = gene.value / maxValue;
            const radius = 4 + Math.sqrt(strength) * 10;

            return (
              <G key={gene.name}>
                <Line
                  x1={x}
                  y1={upperY}
                  x2={x}
                  y2={lowerY}
                  stroke={gene.color}
                  strokeWidth={2 + strength * 4}
                  strokeOpacity={0.45}
                  strokeLinecap="round"
                />
                <Circle cx={x} cy={upperY} r={radius} fill={gene.color} />
                <Circle
                  cx={x}
                  cy={lowerY}
                  r={Math.max(3, radius * 0.55)}
                  fill={gene.color}
                  fillOpacity={0.65}
                />
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

export default ExpenseDnaChart;
