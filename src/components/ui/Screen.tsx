import { useNavigation } from '@react-navigation/native';
import type { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../theme';
import AppHeader from './AppHeader';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  right?: React.ReactNode;
  /** Show a back arrow in the header. Defaults to true when the screen can go back. */
  showBack?: boolean;
  scroll?: boolean;
  padded?: boolean;
  center?: boolean;
  footer?: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra offset (e.g. tab bar height) used by the keyboard avoiding view. */
  keyboardVerticalOffset?: number;
}

export function Screen({
  children,
  title,
  subtitle,
  icon,
  right,
  showBack,
  scroll = true,
  padded = true,
  center = false,
  footer,
  contentContainerStyle,
  style,
  edges = ['top'],
  refreshing,
  onRefresh,
  keyboardVerticalOffset = 0,
}: ScreenProps) {
  const navigation = useNavigation<{ canGoBack: () => boolean; goBack: () => void }>();
  const canGoBack = navigation.canGoBack?.();
  const withBack = showBack ?? canGoBack;

  const header =
    title || withBack || right ? (
      <AppHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        right={right}
        onBack={withBack ? () => navigation.goBack() : undefined}
      />
    ) : null;

  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        padded && styles.padded,
        center && styles.center,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, center && styles.center, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {header}
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  padded: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.background,
  },
});

export default Screen;
