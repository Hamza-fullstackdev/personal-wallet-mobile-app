import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import AppText from './AppText';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Returns up to 5 page numbers centered around the current page. */
function pageWindow(page: number, totalPages: number): number[] {
  const size = Math.min(5, totalPages);
  let start = Math.max(1, page - Math.floor(size / 2));
  if (start + size - 1 > totalPages) start = totalPages - size + 1;
  return Array.from({ length: size }, (_, index) => start + index);
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
        style={[styles.nav, !canPrev ? styles.disabled : null]}
      >
        <Ionicons name="chevron-back" size={18} color={canPrev ? colors.primary : colors.textMuted} />
      </Pressable>

      {pages.map((item) => {
        const active = item === page;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.page, active ? styles.pageActive : null]}
          >
            <AppText variant="caption" weight="semiBold" color={active ? colors.onPrimary : colors.textSecondary}>
              {String(item)}
            </AppText>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => canNext && onChange(page + 1)}
        disabled={!canNext}
        style={[styles.nav, !canNext ? styles.disabled : null]}
      >
        <Ionicons name="chevron-forward" size={18} color={canNext ? colors.primary : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    nav: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.45 },
    page: {
      minWidth: 38,
      height: 38,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pageActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
  });

export default Pagination;
