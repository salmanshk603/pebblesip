import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  addLog,
  claimGoalCelebration,
  deleteLog,
  getCups,
  getDb,
  getDrinks,
  getSetting,
  getStreak,
  getToday,
  undoLastLog,
  type Cup,
  type Drink,
  type Log,
  type Today,
} from '@/db';
import { todayKey } from '@/lib/dates';
import type { VolumeUnit } from '@/lib/units';

export interface HydrationState {
  today: Today;
  streak: number;
  unit: VolumeUnit;
  cups: Cup[];
  drinks: Drink[];
}

function load(): HydrationState {
  const db = getDb();
  return {
    today: getToday(db),
    streak: getStreak(db),
    unit: getSetting(db, 'volume_unit') === 'oz' ? 'oz' : 'ml',
    cups: getCups(db),
    drinks: getDrinks(db),
  };
}

/** Today's data for Home, kept fresh on focus, app resume and local midnight. */
export function useHydration() {
  const [state, setState] = useState<HydrationState>(load);
  const refresh = useCallback(() => setState(load()), []);

  useFocusEffect(refresh);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  // Roll over to the new day while the app stays open. Polls the local date instead of
  // one long timer so clock or timezone changes are picked up too.
  useEffect(() => {
    const id = setInterval(() => {
      if (todayKey() !== state.today.date) refresh();
    }, 30_000);
    return () => clearInterval(id);
  }, [refresh, state.today.date]);

  const add = useCallback(
    (amountMl: number, drinkId?: string): { log: Log; celebrate: boolean } => {
      const db = getDb();
      const log = addLog(db, { amountMl, drinkId });
      const celebrate = claimGoalCelebration(db);
      refresh();
      return { log, celebrate };
    },
    [refresh],
  );

  const undo = useCallback(() => {
    undoLastLog(getDb());
    refresh();
  }, [refresh]);

  const remove = useCallback(
    (id: string) => {
      deleteLog(getDb(), id);
      refresh();
    },
    [refresh],
  );

  return { ...state, add, undo, remove, refresh };
}
