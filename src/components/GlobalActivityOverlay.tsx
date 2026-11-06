import { useIsMutating } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';

import { Radius, Shadows, Spacing, type ThemeColors } from '../theme';
import { useThemedStyles } from '../theme/ThemeProvider';
import { AdvancedSpinner, AppText } from './ui';

/** Safety net: never keep a blocking overlay up longer than this. */
const MAX_VISIBLE_MS = 20_000;

/**
 * Full-screen branded overlay that appears whenever a write request (mutation)
 * is in flight. Showing is delayed slightly so fast operations never flash the
 * overlay, and it force-hides after a safety timeout so a stalled request can
 * never trap the user behind a spinner.
 */
export function GlobalActivityOverlay() {
  const styles = useThemedStyles(createStyles);
  const mutating = useIsMutating();
  const active = mutating > 0;

  const [rendered, setRendered] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      showTimer.current = setTimeout(() => setRendered(true), 150);
      return () => {
        if (showTimer.current) {
          clearTimeout(showTimer.current);
          showTimer.current = null;
        }
      };
    }

    Animated.timing(fade, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
    return undefined;
  }, [active, fade]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      fade.setValue(0);
      setRendered(false);
    }, MAX_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [active, fade]);

  useEffect(() => {
    if (!rendered) return;
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [rendered, fade]);

  if (!rendered) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={() => undefined}>
      <Animated.View style={[styles.overlay, { opacity: fade }]}>
        <View style={[styles.card, Shadows.card]}>
          <AdvancedSpinner size={62} />
          <AppText variant="label" style={styles.message}>
            Processing request
          </AppText>
        </View>
      </Animated.View>
    </Modal>
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
    card: {
      minWidth: 168,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.xxl,
      borderRadius: Radius.xl,
      backgroundColor: colors.surface,
      alignItems: 'center',
      gap: Spacing.md,
    },
    message: {
      color: colors.textSecondary,
      letterSpacing: 0.4,
    },
  });

export default GlobalActivityOverlay;
