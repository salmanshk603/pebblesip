import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useTheme } from '@/theme';

type Props = { message: string; onUndo: () => void; onHide: () => void; bottom: number };

/** Slides up for 4s with an Undo action (animations.md). Render it only while it should show. */
export function UndoSnackbar({ message, onUndo, onHide, bottom }: Props) {
  const { colors, typography } = useTheme();
  useEffect(() => {
    const t = setTimeout(onHide, 4000);
    return () => clearTimeout(t);
  }, [message, onHide]);

  return (
    <Animated.View
      entering={SlideInDown.duration(200)}
      exiting={SlideOutDown.duration(200)}
      accessibilityLiveRegion="polite"
      style={[styles.bar, { backgroundColor: colors.onSurface, bottom }]}
    >
      <Text style={[typography.bodyMd, { color: colors.surface, flex: 1 }]}>{message}</Text>
      <Pressable accessibilityRole="button" onPress={onUndo} hitSlop={8} style={styles.action}>
        <Text style={[typography.labelLg, { color: colors.primaryContainer }]}>UNDO</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
  },
  action: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
});
