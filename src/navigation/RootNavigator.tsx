import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlobalActivityOverlay } from '../components/GlobalActivityOverlay';
import { Logo } from '../components/ui';
import LoginScreen from '../screens/auth/LoginScreen';
import { selectIsAuthenticated, useAuthStore } from '../store/authStore';
import { Colors } from '../theme';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.divider,
    notification: Colors.primary,
  },
};

export function RootNavigator() {
  const booted = useAuthStore((state) => state.booted);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const [routeChanging, setRouteChanging] = useState(false);
  const routeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstChange = useRef(true);

  const handleStateChange = useCallback(() => {
    // Skip the very first state event fired while the container becomes ready.
    if (firstChange.current) {
      firstChange.current = false;
      return;
    }
    setRouteChanging(true);
    if (routeTimer.current) clearTimeout(routeTimer.current);
    routeTimer.current = setTimeout(() => setRouteChanging(false), 420);
  }, []);

  useEffect(
    () => () => {
      if (routeTimer.current) clearTimeout(routeTimer.current);
    },
    [],
  );

  if (!booted) {
    return (
      <View style={styles.splash}>
        <Logo size={96} tagline="Your money, organized." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NavigationContainer theme={navigationTheme} onStateChange={handleStateChange}>
        {isAuthenticated ? (
          <MainTabs />
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
      <GlobalActivityOverlay routeChanging={routeChanging} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigator;
