import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/** Stats bar that grows from 0 (animations.md: staggered 40 ms each). Static with reduce motion. */
export function GrowBar({
  height,
  index,
  playKey,
  style,
}: {
  height: number;
  index: number;
  /** Change (e.g. the period) to replay the growth. */
  playKey: string;
  style: ViewStyle;
}) {
  const reduce = useReducedMotion();
  const h = useSharedValue(reduce ? height : 0);
  useEffect(() => {
    if (reduce) {
      h.value = height;
      return;
    }
    h.value = 0;
    h.value = withDelay(
      index * 40,
      withTiming(height, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, [height, index, playKey, reduce, h]);
  const anim = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[style, anim]} />;
}
