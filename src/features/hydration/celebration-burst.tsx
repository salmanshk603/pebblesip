import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { brand } from '@/theme/colors';

const COUNT = 14;
const COLORS = [brand.pipGradientStart, brand.pipGradientEnd, brand.pastelAqua, '#FFFFFF'];

function Drop({
  i,
  progress,
  radius,
}: {
  i: number;
  progress: SharedValue<number>;
  radius: number;
}) {
  const angle = (i / COUNT) * Math.PI * 2;
  const dist = radius * (0.8 + (i % 3) * 0.15);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p + 40 * p * p },
        { scale: 1 - 0.4 * p },
      ],
    };
  });
  const size = 8 + (i % 3) * 3;
  return (
    <Animated.View
      style={[
        styles.drop,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS[i % COLORS.length],
        },
        style,
      ]}
    />
  );
}

/** Droplet burst for the goal celebration (~1.2s). Change `playKey` to replay. */
export function CelebrationBurst({ playKey, radius }: { playKey: number; radius: number }) {
  const reduce = useReducedMotion();
  const progress = useSharedValue(1);
  useEffect(() => {
    if (playKey === 0 || reduce) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) });
  }, [playKey, reduce, progress]);

  if (playKey === 0 || reduce) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Drop key={`${playKey}-${i}`} i={i} progress={progress} radius={radius} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  drop: { position: 'absolute' },
});
