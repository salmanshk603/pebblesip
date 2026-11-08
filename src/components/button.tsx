import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useTheme } from '@/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'ghost';
};

export function Button({ label, variant = 'primary', disabled, ...rest }: Props) {
  const { colors, typography, radius } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radius.full,
          backgroundColor: primary ? colors.primary : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      {...rest}
    >
      <Text
        style={[
          typography.labelLg,
          { color: primary ? colors.onPrimary : colors.primary, fontSize: 16 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
});
