import { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import type { CashflowPoint } from '../../utils/chartData';

const HEIGHT = 220;
const PADDING = { top: 18, right: 12, bottom: 30, left: 48 };
const GRID_RATIOS = [0, 1 / 3, 2 / 3, 1];

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

function labelIndices(length: number, count: number): number[] {
  if (length <= 0) return [];
  if (length <= count) return Array.from({ length }, (_, index) => index);
  return Array.from({ length: count }, (_, index) =>
    Math.round((index / (count - 1)) * (length - 1)),
  );
}

export function BarChart({ data }: { data: CashflowPoint[] }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const maxValue = niceMax(
    Math.max(0, ...data.map((point) => Math.max(point.income, point.spending))),
  );
  const baseline = PADDING.top + plotHeight;
  const groupWidth = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.max(2, Math.min(10, groupWidth * 0.32));
  const indices = labelIndices(data.length, 5);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: HEIGHT }}
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {GRID_RATIOS.map((ratio) => {
            const y = PADDING.top + plotHeight * (1 - ratio);
            return (
              <Line
                key={`grid-${ratio}`}
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y}
                y2={y}
                stroke={colors.divider}
                strokeWidth={1}
              />
            );
          })}
          {GRID_RATIOS.map((ratio) => {
            const y = PADDING.top + plotHeight * (1 - ratio);
            return (
              <SvgText
                key={`label-${ratio}`}
                x={PADDING.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill={colors.textMuted}
              >
                {compact(maxValue * ratio)}
              </SvgText>
            );
          })}
          {data.map((point, index) => {
            const center = PADDING.left + groupWidth * (index + 0.5);
            const incomeHeight = (point.income / maxValue) * plotHeight;
            const spendingHeight = (point.spending / maxValue) * plotHeight;

            return (
              <G key={`bars-${point.key}`}>
                {incomeHeight > 0 ? (
                  <Rect
                    x={center - barWidth - 1}
                    y={baseline - incomeHeight}
                    width={barWidth}
                    height={incomeHeight}
                    rx={Math.min(2, barWidth / 2)}
                    fill={colors.success}
                  />
                ) : null}
                {spendingHeight > 0 ? (
                  <Rect
                    x={center + 1}
                    y={baseline - spendingHeight}
                    width={barWidth}
                    height={spendingHeight}
                    rx={Math.min(2, barWidth / 2)}
                    fill={colors.danger}
                  />
                ) : null}
              </G>
            );
          })}
          {indices.map((index) => {
            const center = PADDING.left + groupWidth * (index + 0.5);
            const anchor =
              data.length <= 1
                ? 'middle'
                : index === 0
                  ? 'start'
                  : index === data.length - 1
                    ? 'end'
                    : 'middle';
            return (
              <SvgText
                key={`x-${data[index].key}`}
                x={center}
                y={HEIGHT - 8}
                textAnchor={anchor}
                fontSize={10}
                fill={colors.textMuted}
              >
                {data[index].label}
              </SvgText>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

export default BarChart;
