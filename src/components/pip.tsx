import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { brand } from '@/theme/colors';

/** Pip's 4 moods (animations.md): sleepy 0–25%, okay 25–75%, happy 75–99%, glowing 100%. */
export type PipMood = 'sleepy' | 'okay' | 'happy' | 'glowing';

export function moodFor(progress: number): PipMood {
  if (progress >= 1) return 'glowing';
  if (progress >= 0.75) return 'happy';
  if (progress >= 0.25) return 'okay';
  return 'sleepy';
}

/** Pip, the sea-glass pebble (from the Stitch design, design/brand). Static drawing; motion is in AnimatedPip. */
export function Pip({
  size = 160,
  eyesClosed = false,
  mood = 'okay',
  sweat = false,
}: {
  size?: number;
  eyesClosed?: boolean;
  mood?: PipMood;
  /** Onboarding reaction to a hot climate. */
  sweat?: boolean;
}) {
  const sleepy = mood === 'sleepy';
  const big = mood === 'happy' || mood === 'glowing';
  const blush = big ? 0.9 : sleepy ? 0.4 : 0.65;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Pip the pebble">
      <Defs>
        <LinearGradient id="pipBody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brand.pipGradientStart} />
          <Stop offset="1" stopColor={brand.pipGradientEnd} />
        </LinearGradient>
      </Defs>
      <Path
        d="M22 45 C20 25, 40 14, 58 15 C76 16, 85 28, 83 52 C81 74, 68 85, 48 85 C28 85, 24 65, 22 45 Z"
        fill="url(#pipBody)"
      />
      <Ellipse
        cx={36}
        cy={28}
        rx={12}
        ry={6.5}
        fill="#FFFFFF"
        opacity={0.6}
        transform="rotate(-20 36 28)"
      />
      {sleepy && !eyesClosed ? (
        <>
          {/* half-closed eyes */}
          <Path
            d="M 38.5 48 L 45.5 48"
            stroke={brand.pipEye}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Path
            d="M 60.5 48 L 67.5 48"
            stroke={brand.pipEye}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </>
      ) : eyesClosed ? (
        <>
          <Path
            d="M 38.5 48.5 Q 42 50.5 45.5 48.5"
            stroke={brand.pipEye}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 60.5 48.5 Q 64 50.5 67.5 48.5"
            stroke={brand.pipEye}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <Circle cx={42} cy={48} r={3.5} fill={brand.pipEye} />
          <Circle cx={43.2} cy={46.8} r={1.2} fill="#FFFFFF" />
          <Circle cx={64} cy={48} r={3.5} fill={brand.pipEye} />
          <Circle cx={65.2} cy={46.8} r={1.2} fill="#FFFFFF" />
        </>
      )}
      <Ellipse
        cx={36}
        cy={56}
        rx={big ? 5.5 : 4.5}
        ry={big ? 3 : 2.5}
        fill={brand.pipBlush}
        opacity={blush}
      />
      <Ellipse
        cx={70}
        cy={56}
        rx={big ? 5.5 : 4.5}
        ry={big ? 3 : 2.5}
        fill={brand.pipBlush}
        opacity={blush}
      />
      <Path
        d={
          big ? 'M 47 54 Q 53 61 59 54' : sleepy ? 'M 50 56 Q 53 57 56 56' : 'M 49 54 Q 53 58 57 54'
        }
        stroke={brand.pipEye}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {sweat ? (
        <Path
          d="M 80 26 C 76 32, 76 36, 80 37 C 84 36, 84 32, 80 26 Z"
          fill="#9FDCF5"
          stroke="#5FB6DB"
          strokeWidth={0.8}
        />
      ) : null}
    </Svg>
  );
}
