import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

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

export function LineChart({ data }: { data: CashflowPoint[] }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 0);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const maxValue = niceMax(
    Math.max(0, ...data.map((point) => Math.max(point.income, point.spending))),
  );
  const baseline = PADDING.top + plotHeight;
  const xFor = (index: number) =>
    data.length <= 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (data.length - 1)) * plotWidth;
  const yFor = (value: number) => baseline - (value / maxValue) * plotHeight;
  const linePath = (key: 'income' | 'spending') =>
    data
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point[key])}`)
      .join(' ');
  const areaPath = (key: 'income' | 'spending') =>
    data.length
      ? `${linePath(key)} L ${xFor(data.length - 1)} ${baseline} L ${xFor(0)} ${baseline} Z`
      : '';
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
          <Path d={areaPath('income')} fill={colors.success} fillOpacity={0.08} />
          <Path d={areaPath('spending')} fill={colors.danger} fillOpacity={0.08} />
          <Path
            d={linePath('income')}
            stroke={colors.success}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d={linePath('spending')}
            stroke={colors.danger}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {data.length <= 14
            ? data.map((point, index) => (
                <Circle
                  key={`income-dot-${point.key}`}
                  cx={xFor(index)}
                  cy={yFor(point.income)}
                  r={2.8}
                  fill={colors.success}
                />
              ))
            : null}
          {data.length <= 14
            ? data.map((point, index) => (
                <Circle
                  key={`spending-dot-${point.key}`}
                  cx={xFor(index)}
                  cy={yFor(point.spending)}
                  r={2.8}
                  fill={colors.danger}
                />
              ))
            : null}
          {indices.map((index) => {
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
                x={xFor(index)}
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

export default LineChart;
