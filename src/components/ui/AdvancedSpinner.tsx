import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Colors, Gradients } from '../../theme';

export interface AdvancedSpinnerProps {
  size?: number;
}

/**
 * A layered, brand-colored spinner: two counter-rotating rings around a pulsing
 * gradient wallet chip. Built with the RN Animated API (native driver) so it can
 * run inside overlays without extra dependencies.
 */
export function AdvancedSpinner({ size = 72 }: AdvancedSpinnerProps) {
  const spin = useRef(new Animated.Value(0)).current;
  const spinReverse = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.timing(spinReverse, {
          toValue: 1,
          duration: 1700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [spin, spinReverse, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateReverse = spinReverse.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.38] });

  const ringWidth = Math.max(3, Math.round(size * 0.06));
  const innerSize = size * 0.62;
  const coreSize = size * 0.4;

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
            transform: [{ scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: ringWidth,
            transform: [{ rotate }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ringInner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            borderWidth: ringWidth,
            transform: [{ rotate: rotateReverse }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.core,
            { width: coreSize, height: coreSize, borderRadius: coreSize * 0.34 },
          ]}
        >
          <Ionicons name="wallet" size={coreSize * 0.5} color={Colors.onPrimary} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: Colors.primarySoft },
  ring: {
    position: 'absolute',
    borderColor: Colors.primarySoft,
    borderTopColor: Colors.primary,
  },
  ringInner: {
    position: 'absolute',
    borderColor: 'transparent',
    borderTopColor: Colors.primaryLight,
    borderBottomColor: Colors.primaryLight,
  },
  core: { alignItems: 'center', justifyContent: 'center' },
});

export default AdvancedSpinner;
