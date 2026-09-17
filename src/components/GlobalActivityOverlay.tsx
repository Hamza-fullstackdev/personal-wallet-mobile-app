import { useIsMutating } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '../theme';
import { AdvancedSpinner, AppText } from './ui';

interface GlobalActivityOverlayProps {
  /** True while the navigation state is changing (screen switch). */
  routeChanging: boolean;
}

/**
 * Full-screen branded overlay that appears whenever a write request (mutation)
 * is in flight or the user is switching screens. Showing is delayed slightly so
 * fast operations never flash the overlay.
 */
export function GlobalActivityOverlay({ routeChanging }: GlobalActivityOverlayProps) {
  const mutating = useIsMutating();
  const active = mutating > 0 || routeChanging;

  const [rendered, setRendered] = useState(false);
  const [message, setMessage] = useState('Loading');
  const fade = useRef(new Animated.Value(0)).current;
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      showTimer.current = setTimeout(() => {
        setMessage(mutating > 0 ? 'Processing request' : 'Loading');
        setRendered(true);
      }, 150);
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
  }, [active, mutating, fade]);

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
            {message}
          </AppText>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotMuted]} />
            <View style={[styles.dot, styles.dotFaint]} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(33, 29, 56, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 168,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: Spacing.md,
  },
  message: {
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  dotMuted: {
    backgroundColor: Colors.primaryLight,
  },
  dotFaint: {
    backgroundColor: Colors.primarySoft,
  },
});

export default GlobalActivityOverlay;
