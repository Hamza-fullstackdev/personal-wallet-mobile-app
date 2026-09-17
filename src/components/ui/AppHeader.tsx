import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Gradients, Radius, Spacing } from '../../theme';
import AppText from './AppText';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: IoniconName;
  onBack?: () => void;
  right?: React.ReactNode;
  left?: React.ReactNode;
}

export function AppHeader({ title, subtitle, icon, onBack, right, left }: AppHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.left}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primaryDeep} />
            </Pressable>
          ) : null}
          {left}
          {icon && !onBack ? (
            <View style={styles.iconChip}>
              <Ionicons name={icon} size={20} color={Colors.primary} />
            </View>
          ) : null}
          {title ? (
            <View style={styles.titleBlock}>
              <AppText variant="h3" numberOfLines={1}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="caption" numberOfLines={1} style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    shadowColor: '#3A287A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    minHeight: 64,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  titleBlock: { flex: 1 },
  subtitle: { marginTop: 2 },
  right: { marginLeft: Spacing.md },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  accent: {
    height: 2,
    width: '100%',
    opacity: 0.9,
  },
});

export default AppHeader;
