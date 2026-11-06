import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';

export interface AdvancedSpinnerProps {
  size?: number;
}

/**
 * Calm, modern brand loader: two copper dots orbiting a thin track around a
 * gently breathing wallet chip, wrapped in a soft halo that pulses outward.
 * Uses the RN Animated API with the native driver so it stays smooth inside
 * overlays and modals.
 */
export function AdvancedSpinner({ size = 72 }: AdvancedSpinnerProps) {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(createStyles);

  const orbit = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(orbit, {
          toValue: 1,
          duration: 1700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(breath, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(halo, {
            toValue: 1,
            duration: 1700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(halo, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [orbit, breath, halo]);

  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const coreScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.08] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const orbitSize = size * 0.84;
  const dot = Math.max(6, Math.round(size * 0.085));
  const smallDot = Math.max(4, Math.round(dot * 0.68));
  const coreSize = size * 0.42;
  const radius = orbitSize / 2 - dot / 2;
  const center = orbitSize / 2;
  const orbitOffset = (size - orbitSize) / 2;
  const coreOffset = (size - coreSize) / 2;

  const dotPosition = (angleDeg: number, dotSize: number) => {
    const angle = (angleDeg * Math.PI) / 180;
    return {
      width: dotSize,
      height: dotSize,
      borderRadius: dotSize / 2,
      left: center + radius * Math.cos(angle) - dotSize / 2,
      top: center + radius * Math.sin(angle) - dotSize / 2,
    };
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />

      <View
        style={[
          styles.track,
          {
            width: orbitSize,
            height: orbitSize,
            borderRadius: orbitSize / 2,
            left: orbitOffset,
            top: orbitOffset,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.orbit,
          {
            width: orbitSize,
            height: orbitSize,
            left: orbitOffset,
            top: orbitOffset,
            transform: [{ rotate }],
          },
        ]}
      >
        <View style={[styles.dotPrimary, dotPosition(-90, dot)]} />
        <View style={[styles.dotSecondary, dotPosition(140, smallDot)]} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          left: coreOffset,
          top: coreOffset,
          transform: [{ scale: coreScale }],
        }}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.core,
            { width: coreSize, height: coreSize, borderRadius: coreSize * 0.34 },
          ]}
        >
          <Ionicons name="wallet" size={coreSize * 0.5} color={colors.onPrimary} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    halo: {
      position: 'absolute',
      top: 0,
      left: 0,
      backgroundColor: colors.primarySoft,
    },
    track: {
      position: 'absolute',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    orbit: { position: 'absolute' },
    dotPrimary: {
      position: 'absolute',
      backgroundColor: colors.primary,
    },
    dotSecondary: {
      position: 'absolute',
      backgroundColor: colors.primaryLight,
    },
    core: { alignItems: 'center', justifyContent: 'center' },
  });

export default AdvancedSpinner;
