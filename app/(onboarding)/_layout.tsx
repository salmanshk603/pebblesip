import { Stack } from 'expo-router';

import { DraftProvider } from '@/features/onboarding/draft-context';
import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <DraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </DraftProvider>
  );
}
