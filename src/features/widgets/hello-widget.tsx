'use no memo';
// Widgets run as plain functions; the React Compiler must skip them (BUG-001).

import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { brand, light } from '@/theme/colors';

// Phase 1 spike only: proves widgets render in the dev build. Real widgets come in Phase 7.
export function HelloWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: brand.cream,
        borderRadius: 24,
      }}
    >
      <TextWidget text="Hello" style={{ fontSize: 28, color: light.primary, fontWeight: '700' }} />
      <TextWidget text="from Pebblesip" style={{ fontSize: 14, color: light.onSurfaceVariant }} />
    </FlexWidget>
  );
}
