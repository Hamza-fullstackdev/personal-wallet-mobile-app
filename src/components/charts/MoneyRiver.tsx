import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { Fonts } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

export interface RiverNode {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface MoneyRiverProps {
  income: RiverNode[];
  expense: RiverNode[];
  width: number;
  height: number;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

const EDGE = 18;
const CENTER_RADIUS = 30;
const VERTICAL_PADDING = 30;

function distribute(count: number, height: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [height / 2];
  const top = VERTICAL_PADDING;
  const bottom = height - VERTICAL_PADDING;
  const step = (bottom - top) / (count - 1);
  return Array.from({ length: count }, (_, index) => top + step * index);
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

function shortName(name: string): string {
  return name.length > 13 ? `${name.slice(0, 12)}…` : name;
}

export function MoneyRiver({
  income,
  expense,
  width,
  height,
  selectedId,
  onSelect,
}: MoneyRiverProps) {
  const { colors } = useTheme();

  if (width <= 0 || height <= 0) return null;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxIncome = Math.max(1, ...income.map((node) => node.value));
  const maxExpense = Math.max(1, ...expense.map((node) => node.value));

  const incomeYs = distribute(income.length, height);
  const expenseYs = distribute(expense.length, height);

  const toggle = (id: string) => {
    onSelect?.(selectedId === id ? null : id);
  };

  return (
    <Svg width={width} height={height}>
      {income.map((node, index) => {
        const y = incomeYs[index];
        const isSelected = selectedId === node.id;
        const dimmed = Boolean(selectedId) && !isSelected;
        const startX = EDGE + 10;
        const strokeWidth = 2 + (node.value / maxIncome) * 16;
        return (
          <Path
            key={`income-flow-${node.id}`}
            d={curve(startX, y, centerX - CENTER_RADIUS, centerY)}
            stroke={node.color}
            strokeWidth={strokeWidth}
            strokeOpacity={dimmed ? 0.08 : isSelected ? 0.75 : 0.28}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      {expense.map((node, index) => {
        const y = expenseYs[index];
        const isSelected = selectedId === node.id;
        const dimmed = Boolean(selectedId) && !isSelected;
        const strokeWidth = 2 + (node.value / maxExpense) * 16;
        return (
          <Path
            key={`expense-flow-${node.id}`}
            d={curve(centerX + CENTER_RADIUS, centerY, width - EDGE - 10, y)}
            stroke={node.color}
            strokeWidth={strokeWidth}
            strokeOpacity={dimmed ? 0.08 : isSelected ? 0.75 : 0.28}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}

      <Circle
        cx={centerX}
        cy={centerY}
        r={CENTER_RADIUS}
        fill={colors.primarySoft}
        stroke={colors.primary}
        strokeWidth={1.5}
      />
      <Circle cx={centerX} cy={centerY} r={CENTER_RADIUS - 9} fill={colors.primary} />
      <SvgText
        x={centerX}
        y={centerY + 4}
        textAnchor="middle"
        fontSize={9}
        fontFamily={Fonts.semiBold}
        fill={colors.onPrimary}
      >
        WALLET
      </SvgText>

      {income.map((node, index) => {
        const y = incomeYs[index];
        const radius = 7 + Math.sqrt(node.value / maxIncome) * 8;
        const isSelected = selectedId === node.id;
        return (
          <Circle
            key={`income-node-${node.id}`}
            cx={EDGE + 10}
            cy={y}
            r={radius + (isSelected ? 2 : 0)}
            fill={node.color}
            stroke={isSelected ? colors.textPrimary : colors.surface}
            strokeWidth={isSelected ? 2.5 : 2}
            onPress={() => toggle(node.id)}
          />
        );
      })}

      {expense.map((node, index) => {
        const y = expenseYs[index];
        const radius = 7 + Math.sqrt(node.value / maxExpense) * 8;
        const isSelected = selectedId === node.id;
        return (
          <Circle
            key={`expense-node-${node.id}`}
            cx={width - EDGE - 10}
            cy={y}
            r={radius + (isSelected ? 2 : 0)}
            fill={node.color}
            stroke={isSelected ? colors.textPrimary : colors.surface}
            strokeWidth={isSelected ? 2.5 : 2}
            onPress={() => toggle(node.id)}
          />
        );
      })}

      {income.map((node, index) => (
        <SvgText
          key={`income-label-${node.id}`}
          x={EDGE + 10}
          y={incomeYs[index] - 18}
          textAnchor="start"
          fontSize={9}
          fill={colors.textSecondary}
          pointerEvents="none"
        >
          {shortName(node.name)}
        </SvgText>
      ))}

      {expense.map((node, index) => (
        <SvgText
          key={`expense-label-${node.id}`}
          x={width - EDGE - 10}
          y={expenseYs[index] - 18}
          textAnchor="end"
          fontSize={9}
          fill={colors.textSecondary}
          pointerEvents="none"
        >
          {shortName(node.name)}
        </SvgText>
      ))}
    </Svg>
  );
}

export default MoneyRiver;
