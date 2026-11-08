import { Canvas, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

type Props = {
  size: number;
  /** 0–1 (values above 1 are shown full). */
  fill: number;
  /** Wave drift runs only while true (screen focused). */
  active: boolean;
  children?: ReactNode;
};

const AMP = 6;
const TWO_PI = Math.PI * 2;

/** Round "reservoir" with a drifting sine-wave water level (Skia). */
export function WaterReservoir({ size, fill, active, children }: Props) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const level = useSharedValue(Math.min(1, fill));
  const phase = useSharedValue(0);

  useEffect(() => {
    level.value = withTiming(Math.min(1, Math.max(0, fill)), {
      duration: reduce ? 0 : 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [fill, reduce, level]);

  useEffect(() => {
    if (!active || reduce) {
      cancelAnimation(phase);
      return;
    }
    phase.value = 0;
    phase.value = withRepeat(
      withTiming(TWO_PI, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(phase);
  }, [active, reduce, phase]);

  const clip = useMemo(() => {
    return Skia.PathBuilder.Make()
      .addCircle(size / 2, size / 2, size / 2)
      .build();
  }, [size]);

  const makeWave = (lvl: number, ph: number, offset: number, amp: number) => {
    'worklet';
    const p = Skia.PathBuilder.Make();
    // At 100% lift the crest fully above the top so the circle reads as full.
    const top = size * (1 - lvl) - (lvl >= 1 ? AMP * 2 : 0);
    p.moveTo(0, size);
    for (let x = 0; x <= size; x += 4) {
      p.lineTo(x, top + amp * Math.sin((x / size) * TWO_PI + ph + offset));
    }
    p.lineTo(size, size);
    p.close();
    return p.build();
  };

  // Read the shared values directly here so Reanimated tracks them (BUG-002).
  const back = useDerivedValue(() => makeWave(level.value, phase.value, Math.PI, AMP * 0.7));
  const front = useDerivedValue(() => makeWave(level.value, phase.value, 0, AMP));

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group clip={clip}>
          <Path path={clip} color={colors.surfaceContainerLow} />
          <Path path={back} color={colors.secondaryContainer} opacity={0.7} />
          <Path path={front}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, size)}
              colors={[colors.waterTop, colors.waterBottom]}
            />
          </Path>
        </Group>
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
