import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Gradients, Radius, Shadows, Spacing } from '../../theme';
import { initialOf } from '../../utils/format';
import { AppText } from '../ui';

interface HomeHeaderProps {
  name?: string | null;
  onPressAvatar?: () => void;
  onPressNotifications?: () => void;
  hasAlert?: boolean;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHeader({
  name,
  onPressAvatar,
  onPressNotifications,
  hasAlert = false,
}: HomeHeaderProps) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const firstName = name?.trim().split(/\s+/)[0] ?? 'there';

  return (
    <LinearGradient
      colors={Gradients.brandSoft}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.header}
    >
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <LinearGradient
            colors={Gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandMark}
          >
            <Ionicons name="wallet" size={20} color={Colors.onPrimary} />
          </LinearGradient>
          <View>
            <AppText weight="semiBold" style={styles.brandName}>
              Personal Wallet
            </AppText>
            <AppText variant="caption">{today}</AppText>
          </View>
        </View>

        <View style={styles.actions}>
          {onPressNotifications ? (
            <Pressable
              onPress={onPressNotifications}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.primaryDeep} />
              {hasAlert ? <View style={styles.dot} /> : null}
            </Pressable>
          ) : null}
          <Pressable
            onPress={onPressAvatar}
            disabled={!onPressAvatar}
            hitSlop={8}
            style={({ pressed }) => [pressed ? styles.pressed : null]}
          >
            <LinearGradient
              colors={Gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <AppText variant="h3" color={Colors.onPrimary}>
                {initialOf(name)}
              </AppText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <View style={styles.greeting}>
        <AppText variant="label">{getGreeting()},</AppText>
        <AppText variant="h1" numberOfLines={1} style={styles.greetingName}>
          {firstName}
        </AppText>
        <AppText variant="caption" style={styles.greetingHint}>
          Here is your money at a glance.
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  brandName: { color: Colors.primaryDeep },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  pressed: { opacity: 0.75 },
  greeting: { marginTop: Spacing.xxl },
  greetingName: { marginTop: 2 },
  greetingHint: { marginTop: Spacing.xs },
});

export default HomeHeader;
