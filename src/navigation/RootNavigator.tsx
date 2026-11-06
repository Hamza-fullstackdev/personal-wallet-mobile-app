import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlobalActivityOverlay } from '../components/GlobalActivityOverlay';
import { Logo } from '../components/ui';
import LoginScreen from '../screens/auth/LoginScreen';
import { selectIsAuthenticated, useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeProvider';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const booted = useAuthStore((state) => state.booted);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { colors, mode } = useTheme();

  const navigationTheme: Theme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.divider,
        notification: colors.primary,
      },
    };
  }, [mode, colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        splash: {
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors],
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
      <NavigationContainer theme={navigationTheme}>
        {isAuthenticated ? (
          <MainTabs />
        ) : (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
          </AuthStack.Navigator>
        )}
      </NavigationContainer>
      <GlobalActivityOverlay />
    </View>
  );
}

export default RootNavigator;
