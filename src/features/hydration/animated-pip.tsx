import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { moodFor, Pip } from '@/components/pip';
import { brand } from '@/theme/colors';

type Props = {
  size: number;
  /** Idle loops run only while true (screen focused). */
  active: boolean;
  /** Increment to play the sip squash-and-stretch. */
  sipKey: number;
  /** 0–1 share of today's goal; picks Pip's mood. */
  progress?: number;
};

const ease = Easing.inOut(Easing.sin);

/**
 * Pip motion per animations.md:
 * - sleepy (0–25%): slow breathing (scale 1 ↔ 1.03, 3 s), half-closed eyes, a faint "z" every ~5 s
 * - okay (25–75%): idle bob ±4 px (2.5 s), blink every ~4 s
 * - happy (75–99%): bob + a small hop every ~6 s, bigger smile and blush
 * - glowing (100%): soft glow pulse (0.4 ↔ 0.8) + 3 twinkling sparkles
 * - any: squash & stretch on sip.
 * Reduce motion: static Pip in the right mood, no loops, no particles.
 */
export function AnimatedPip({ size, active, sipKey, progress = 0.5 }: Props) {
  const reduce = useReducedMotion();
  const mood = moodFor(progress);
  const run = active && !reduce;
  const bob = useSharedValue(0);
  const breathe = useSharedValue(1);
  const squash = useSharedValue(1);
  const glow = useSharedValue(0);
  const z = useSharedValue(0);
  const sparkle = useSharedValue(0);
  const [blink, setBlink] = useState(false);

  // Mood loops.
  useEffect(() => {
    [bob, breathe, glow, z, sparkle].forEach((v) => cancelAnimation(v));
    bob.value = withTiming(0, { duration: 150 });
    breathe.value = withTiming(1, { duration: 150 });
    glow.value = withTiming(mood === 'glowing' ? 0.6 : 0, { duration: 200 });
    z.value = 0;
    sparkle.value = mood === 'glowing' ? 1 : 0;
    if (!run) return;

    if (mood === 'sleepy') {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1500, easing: ease }),
          withTiming(1, { duration: 1500, easing: ease }),
        ),
        -1,
      );
      z.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1800 }),
          withTiming(0, { duration: 0 }),
          withDelay(3200, withTiming(0, { duration: 0 })),
        ),
        -1,
      );
    } else {
      const bobLoop = withSequence(
        withTiming(-4, { duration: 1250, easing: ease }),
        withTiming(4, { duration: 1250, easing: ease }),
      );
      bob.value =
        mood === 'happy'
          ? withRepeat(
              withSequence(
                bobLoop,
                bobLoop,
                withTiming(-14, { duration: 180, easing: Easing.out(Easing.quad) }),
                withSpring(0, { damping: 8, stiffness: 220 }),
              ),
              -1,
            )
          : withRepeat(bobLoop, -1, true);
    }
    if (mood === 'glowing') {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200, easing: ease }),
          withTiming(0.4, { duration: 1200, easing: ease }),
        ),
        -1,
      );
      sparkle.value = withRepeat(withTiming(0, { duration: 900, easing: ease }), -1, true);
    }
    return () => [bob, breathe, glow, z, sparkle].forEach((v) => cancelAnimation(v));
  }, [run, mood, bob, breathe, glow, z, sparkle]);

  // Blink (not while sleepy: eyes are already half-closed).
  useEffect(() => {
    if (!run || mood === 'sleepy') return;
    let close: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setBlink(true);
      close = setTimeout(() => setBlink(false), 120);
    }, 4000);
    return () => {
      clearInterval(id);
      if (close) clearTimeout(close);
    };
  }, [run, mood]);

  useEffect(() => {
    if (sipKey === 0 || reduce) return;
    squash.value = withSequence(
      withTiming(0.85, { duration: 90 }),
      withSpring(1.1, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [sipKey, reduce, squash]);

  const pipStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { scale: breathe.value },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const zStyle = useAnimatedStyle(() => ({
    opacity: z.value > 0 && z.value < 1 ? 0.6 * Math.sin(z.value * Math.PI) : 0,
    transform: [{ translateY: -z.value * 18 }, { translateX: z.value * 6 }],
  }));
  const twinkle = (offset: number) => {
    'worklet';
    return 0.3 + 0.7 * Math.abs(Math.sin((sparkle.value + offset) * Math.PI));
  };
  const s0 = useAnimatedStyle(() => ({ opacity: twinkle(0) }));
  const s1 = useAnimatedStyle(() => ({ opacity: twinkle(1 / 3) }));
  const s2 = useAnimatedStyle(() => ({ opacity: twinkle(2 / 3) }));
  const sparkleStyles = [s0, s1, s2];
  const spots = [
    { top: size * 0.05, left: size * 0.12 },
    { top: size * 0.15, right: size * 0.05 },
    { bottom: size * 0.12, left: size * 0.02 },
  ];

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`Pip is ${mood}`} accessible>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: size * 1.1,
            height: size * 1.1,
            borderRadius: size,
            left: -size * 0.05,
            top: -size * 0.05,
          },
          glowStyle,
        ]}
      />
      <Animated.View style={pipStyle}>
        <Pip size={size} mood={mood} eyesClosed={blink} />
      </Animated.View>
      {mood === 'sleepy' && run ? (
        <Animated.Text
          pointerEvents="none"
          style={[styles.z, { right: size * 0.08, top: size * 0.1 }, zStyle]}
        >
          z
        </Animated.Text>
      ) : null}
      {mood === 'glowing' && !reduce
        ? spots.map((pos, i) => (
            <Animated.Text
              key={i}
              pointerEvents="none"
              style={[styles.sparkle, pos, sparkleStyles[i]]}
            >
              ✦
            </Animated.Text>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', backgroundColor: brand.pastelAqua },
  z: { position: 'absolute', fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  sparkle: { position: 'absolute', fontSize: 14, color: '#FFFFFF' },
});
