import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import AdvancedSpinner from './AdvancedSpinner';
import AppText from './AppText';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={colors.primary} />;
}

interface LoaderProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

/** Full-screen loading overlay (mirrors the web app's loading overlay). */
export function Loader({ visible, message = 'Please wait...', transparent }: LoaderProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.overlay, transparent ? styles.overlayTransparent : null]}>
        <View style={[styles.loaderCard, Shadows.card]}>
          <AdvancedSpinner size={62} />
          {message ? (
            <AppText variant="label" style={styles.loaderText}>
              {message}
            </AppText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

interface EmptyStateProps {
  icon?: IoniconName;
  title: string;
  message?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function EmptyState({ icon = 'file-tray-outline', title, message, style, children }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <AppText variant="h3" center style={styles.emptyTitle}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" center style={styles.emptyMessage}>
          {message}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.backdrop,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlayTransparent: {
      backgroundColor: 'transparent',
    },
    loaderCard: {
      minWidth: 140,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xxl,
      borderRadius: Radius.lg,
      backgroundColor: colors.surface,
      alignItems: 'center',
      gap: Spacing.md,
    },
    loaderText: {
      color: colors.textSecondary,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xxxl,
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: Radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      marginBottom: Spacing.xs,
    },
    emptyMessage: {
      maxWidth: 280,
    },
  });

export default Loader;
