import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';

import { addNotificationResponseReceivedListener } from 'expo-notifications';

import { getDb } from '@/db';
import { handleReminderAction, syncReminders } from '@/features/reminders/reminders';
import { startAds } from '@/features/ads/ads';
import { initPurchases } from '@/features/premium/purchases';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';

import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  useEffect(() => {
    // Opens the DB, runs migrations and seeds defaults on first launch.
    getDb();
    // Reschedule on every app start (settings, timezone or a day may have changed).
    void syncReminders();
    void refreshWidgets();
    // RevenueCat (no-op until a key is configured), then AdMob consent + SDK start.
    void initPurchases();
    void startAds();
    // "+250 ml" pressed while the app is in the foreground.
    const sub = addNotificationResponseReceivedListener((r) => void handleReminderAction(r));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="fasting" />
        <Stack.Screen name="battery-help" />
      </Stack>
    </GestureHandlerRootView>
  );
}
