import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { Fonts } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export interface BubbleMapPoint {
  id: string;
  value: number;
  color: string;
}

interface BubbleMapProps {
  data: BubbleMapPoint[];
  width: number;
  height: number;
  selectedId?: string | null;
  onPress?: (id: string) => void;
  formatValue?: (value: number) => string;
}

interface PackedBubble extends BubbleMapPoint {
  x: number;
  y: number;
  r: number;
}

interface PlacedBubble {
  x: number;
  y: number;
  r: number;
}

interface LayoutItem {
  point: BubbleMapPoint;
  index: number;
  r: number;
}

const PADDING = 12;
const GAP = 0.06;
const SPIRAL_STEP = 0.4;
const SPIRAL_FACTOR = 0.09;
const MAX_SPIRAL_STEPS = 6000;
const GRID_CELL = 1.2;

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const channels = [0, 2, 4].map((offset) => {
    const channel = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  if (channels.some((channel) => Number.isNaN(channel))) return 0;
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function readableTextColor(background: string): string {
  return luminance(background) > 0.55 ? '#2A211B' : '#FFFFFF';
}

function gridKey(x: number, y: number): string {
  return `${Math.floor(x / GRID_CELL)},${Math.floor(y / GRID_CELL)}`;
}

function packBubbles(
  data: BubbleMapPoint[],
  width: number,
  height: number,
): PackedBubble[] {
  const valid = data.filter(
    (point) => point.value > 0 && Number.isFinite(point.value),
  );
  if (valid.length === 0 || width <= 0 || height <= 0) return [];

  const maxValue = Math.max(...valid.map((point) => point.value));
  const items: LayoutItem[] = valid.map((point, index) => ({
    point,
    index,
    r: 0.18 + 0.82 * Math.sqrt(point.value / maxValue),
  }));
  const order = [...items].sort((a, b) => b.r - a.r || a.index - b.index);

  const placed: PlacedBubble[] = [];
  const grid = new Map<string, PlacedBubble[]>();

  const addToGrid = (bubble: PlacedBubble) => {
    const key = gridKey(bubble.x, bubble.y);
    const bucket = grid.get(key);
    if (bucket) bucket.push(bubble);
    else grid.set(key, [bubble]);
  };

  const collides = (x: number, y: number, r: number): boolean => {
    const cx = Math.floor(x / GRID_CELL);
    const cy = Math.floor(y / GRID_CELL);
    for (let ix = cx - 2; ix <= cx + 2; ix += 1) {
      for (let iy = cy - 2; iy <= cy + 2; iy += 1) {
        const bucket = grid.get(`${ix},${iy}`);
        if (!bucket) continue;
        for (const other of bucket) {
          const dx = x - other.x;
          const dy = y - other.y;
          const min = r + other.r + GAP;
          if (dx * dx + dy * dy < min * min) return true;
        }
      }
    }
    return false;
  };

  order.forEach((item, orderIndex) => {
    let x = 0;
    let y = 0;

    if (orderIndex > 0) {
      let theta = 0;
      for (let step = 0; step < MAX_SPIRAL_STEPS; step += 1) {
        theta += SPIRAL_STEP;
        const radius = SPIRAL_FACTOR * theta;
        x = Math.cos(theta) * radius;
        y = Math.sin(theta) * radius;
        if (!collides(x, y, item.r)) break;
      }
    }

    const bubble: PlacedBubble = { x, y, r: item.r };
    placed.push(bubble);
    addToGrid(bubble);
  });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  placed.forEach((bubble) => {
    minX = Math.min(minX, bubble.x - bubble.r);
    minY = Math.min(minY, bubble.y - bubble.r);
    maxX = Math.max(maxX, bubble.x + bubble.r);
    maxY = Math.max(maxY, bubble.y + bubble.r);
  });

  const contentWidth = Math.max(maxX - minX, 0.0001);
  const contentHeight = Math.max(maxY - minY, 0.0001);
  const scale = Math.min(
    (width - PADDING * 2) / contentWidth,
    (height - PADDING * 2) / contentHeight,
  );
  const offsetX =
    PADDING + (width - PADDING * 2 - contentWidth * scale) / 2 - minX * scale;
  const offsetY =
    PADDING + (height - PADDING * 2 - contentHeight * scale) / 2 - minY * scale;

  return order.map((item, orderIndex) => {
    const bubble = placed[orderIndex];
    return {
      ...item.point,
      x: bubble.x * scale + offsetX,
      y: bubble.y * scale + offsetY,
      r: bubble.r * scale,
    };
  });
}

export function BubbleMap({
  data,
  width,
  height,
  selectedId,
  onPress,
  formatValue,
}: BubbleMapProps) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(1)).current;
  const bubbles = useMemo(
    () => packBubbles(data, width, height),
    [data, width, height],
  );

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [data, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <Animated.View
      style={[styles.wrap, { width, height, opacity: progress, transform: [{ scale }] }]}
    >
      <Svg width={width} height={height}>
        {bubbles.map((bubble) => (
          <Circle
            key={bubble.id}
            cx={bubble.x}
            cy={bubble.y}
            r={bubble.r}
            fill={bubble.color}
            fillOpacity={0.94}
            stroke={colors.surface}
            strokeWidth={2}
            onPress={onPress ? () => onPress(bubble.id) : undefined}
          />
        ))}

        {bubbles.map((bubble) =>
          bubble.r >= 15 ? (
            <Circle
              key={`gloss-${bubble.id}`}
              cx={bubble.x - bubble.r * 0.26}
              cy={bubble.y - bubble.r * 0.3}
              r={bubble.r * 0.46}
              fill="rgba(255,255,255,0.16)"
              pointerEvents="none"
            />
          ) : null,
        )}

        {formatValue
          ? bubbles.map((bubble) =>
              bubble.r >= 19 ? (
                <SvgText
                  key={`label-${bubble.id}`}
                  x={bubble.x}
                  y={bubble.y + Math.min(5, bubble.r * 0.12)}
                  fill={readableTextColor(bubble.color)}
                  fontFamily={Fonts.semiBold}
                  fontSize={Math.min(15, Math.max(9, bubble.r * 0.36))}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {formatValue(bubble.value)}
                </SvgText>
              ) : null,
            )
          : null}

        {selectedId
          ? bubbles
              .filter((bubble) => bubble.id === selectedId)
              .map((bubble) => (
                <Circle
                  key={`selected-${bubble.id}`}
                  cx={bubble.x}
                  cy={bubble.y}
                  r={bubble.r + 1.5}
                  fill="none"
                  stroke={colors.textPrimary}
                  strokeWidth={2.5}
                  pointerEvents="none"
                />
              ))
          : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
});

export default BubbleMap;
