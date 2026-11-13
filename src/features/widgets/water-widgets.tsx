'use no memo';
// Widgets run as plain functions; the React Compiler must skip them (BUG-001).

import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import { formatVolume } from '@/lib/units';

import { pipSvg, type WidgetTheme } from './themes';
import type { WidgetData } from './widget-data';

export const SMALL_WIDGET = 'PebbleSmall';
export const MEDIUM_WIDGET = 'PebbleMedium';
/** clickAction for "+ amount" buttons; clickActionData = { ml }. */
export const LOG_ACTION = 'LOG_WATER';
export const SMALL_ADD_ML = 250;

function background(t: WidgetTheme) {
  return { backgroundGradient: { from: t.bgFrom, to: t.bgTo, orientation: 'TL_BR' as const } };
}

function ProgressBar({ pct, t, width }: { pct: number; t: WidgetTheme; width: number }) {
  const fill = Math.round((width * pct) / 100);
  return (
    <FlexWidget
      style={{ width, height: 8, borderRadius: 4, backgroundColor: t.track, flexDirection: 'row' }}
    >
      {fill > 0 ? (
        <FlexWidget style={{ width: fill, height: 8, borderRadius: 4, backgroundColor: t.fill }} />
      ) : null}
    </FlexWidget>
  );
}

function AddButton({
  ml,
  label,
  t,
  size,
}: {
  ml: number;
  label: string;
  t: WidgetTheme;
  size: number;
}) {
  return (
    <FlexWidget
      clickAction={LOG_ACTION}
      clickActionData={{ ml }}
      accessibilityLabel={`Log ${label}`}
      style={{
        height: size,
        width: label === '+' ? size : 'wrap_content',
        paddingHorizontal: label === '+' ? 0 : 12,
        borderRadius: size / 2,
        backgroundColor: t.button,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget
        text={label}
        style={{ fontSize: label === '+' ? 22 : 13, color: t.buttonText, fontWeight: '700' }}
      />
    </FlexWidget>
  );
}

/** 2×2: Pip, %, amount, progress and one-tap "+250 ml". */
export function SmallWaterWidget({ d }: { d: WidgetData }) {
  const t = d.theme;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 24,
        padding: 14,
        justifyContent: 'space-between',
        ...background(t),
      }}
    >
      <SvgWidget svg={pipSvg(t)} style={{ height: 28, width: 28 }} />
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget text={`${d.pct}%`} style={{ fontSize: 30, color: t.text, fontWeight: '700' }} />
        <TextWidget
          text={formatVolume(d.totalMl, d.unit)}
          style={{ fontSize: 12, color: t.subtext }}
        />
      </FlexWidget>
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ProgressBar pct={d.pct} t={t} width={64} />
        <AddButton ml={SMALL_ADD_ML} label="+" t={t} size={36} />
      </FlexWidget>
    </FlexWidget>
  );
}

const time = (ts: number) =>
  `${String(new Date(ts).getHours()).padStart(2, '0')}:${String(new Date(ts).getMinutes()).padStart(2, '0')}`;

/** 4×2: Pip, progress, last drink time and three quick-add buttons. */
export function MediumWaterWidget({ d }: { d: WidgetData }) {
  const t = d.theme;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 24,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        flexGap: 14,
        ...background(t),
      }}
    >
      <SvgWidget svg={pipSvg(t)} style={{ height: 64, width: 64 }} />
      <FlexWidget style={{ flex: 1, flexDirection: 'column', flexGap: 4 }}>
        <TextWidget text={`${d.pct}%`} style={{ fontSize: 28, color: t.text, fontWeight: '700' }} />
        <TextWidget
          text={`${formatVolume(d.totalMl, d.unit)} / ${formatVolume(d.goalMl, d.unit)}`}
          style={{ fontSize: 12, color: t.subtext }}
        />
        <ProgressBar pct={d.pct} t={t} width={120} />
        <TextWidget
          text={d.lastTs ? `Last drink ${time(d.lastTs)}` : 'No drinks yet today'}
          style={{ fontSize: 11, color: t.subtext }}
        />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: 'column', flexGap: 4, alignItems: 'flex-end' }}>
        {d.cupsMl.map((ml) => (
          <AddButton key={ml} ml={ml} label={`+${formatVolume(ml, d.unit)}`} t={t} size={28} />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
