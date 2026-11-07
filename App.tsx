import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReciteDuroodModal } from './src/components/ReciteDuroodModal';
import { ReceiptProvider } from './src/components/receipt/ReceiptProvider';
import { queryClient } from './src/lib/queryClient';
import { useSessionGuard } from './src/hooks/useSessionGuard';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';

// Keep the native splash (configured in app.json) on screen until fonts load
// and the stored session has been restored.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden during fast refresh.
});

export default function App() {
  const booted = useAuthStore((state) => state.booted);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const themeMode = useThemeStore((state) => state.mode);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const markThemeHydrated = useThemeStore((state) => state.setHydrated);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Sign out automatically the moment the session cookie's JWT expires.
  useSessionGuard();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Clear cached server data whenever the session ends (sign-out or a 401) so
  // the next user never sees the previous account's data.
  useEffect(() => {
    return useAuthStore.subscribe((state, previous) => {
      if (previous.token && !state.token) {
        queryClient.clear();
      }
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded && booted && themeHydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, booted, themeHydrated]);

  // Safety net: never keep the splash up if theme rehydration stalls.
  useEffect(() => {
    if (themeHydrated) return;
    const timer = setTimeout(() => markThemeHydrated(), 800);
    return () => clearTimeout(timer);
  }, [themeHydrated, markThemeHydrated]);

  if (!fontsLoaded || !booted || !themeHydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <ReceiptProvider>
          <RootNavigator />
        </ReceiptProvider>
        <ReciteDuroodModal />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
