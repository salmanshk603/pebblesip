import { useEffect, useState } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Pip } from '@/components/pip';

type Props = {
  size: number;
  /** Idle loops run only while true (screen focused). */
  active: boolean;
  /** Increment to play the sip squash-and-stretch. */
  sipKey: number;
};

/** Phase 4 motion per animations.md: idle bob, blink every ~4s, squash & stretch on sip. */
export function AnimatedPip({ size, active, sipKey }: Props) {
  const reduce = useReducedMotion();
  const bob = useSharedValue(0);
  const squash = useSharedValue(1);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!active || reduce) {
      cancelAnimation(bob);
      bob.value = withTiming(0, { duration: 150 });
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 1250, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(bob);
  }, [active, reduce, bob]);

  useEffect(() => {
    if (!active || reduce) return;
    let close: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setBlink(true);
      close = setTimeout(() => setBlink(false), 120);
    }, 4000);
    return () => {
      clearInterval(id);
      if (close) clearTimeout(close);
    };
  }, [active, reduce]);

  useEffect(() => {
    if (sipKey === 0 || reduce) return;
    squash.value = withSequence(
      withTiming(0.85, { duration: 90 }),
      withSpring(1.1, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [sipKey, reduce, squash]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scaleY: squash.value }, { scaleX: 2 - squash.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pip size={size} eyesClosed={blink} />
    </Animated.View>
  );
}
