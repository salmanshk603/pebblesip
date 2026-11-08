import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { brand } from '@/theme/colors';

/** Pip, the sea-glass pebble (from the Stitch design, design/brand). Static for now; motion comes in Phase 4/10. */
export function Pip({ size = 160 }: { size?: number }) {
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
      <Circle cx={42} cy={48} r={3.5} fill={brand.pipEye} />
      <Circle cx={43.2} cy={46.8} r={1.2} fill="#FFFFFF" />
      <Circle cx={64} cy={48} r={3.5} fill={brand.pipEye} />
      <Circle cx={65.2} cy={46.8} r={1.2} fill="#FFFFFF" />
      <Ellipse cx={36} cy={56} rx={4.5} ry={2.5} fill={brand.pipBlush} opacity={0.65} />
      <Ellipse cx={70} cy={56} rx={4.5} ry={2.5} fill={brand.pipBlush} opacity={0.65} />
      <Path
        d="M 49 54 Q 53 58 57 54"
        stroke={brand.pipEye}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
