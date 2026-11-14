import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getDb, getFirstDate, getRange } from '@/db';
import { todayKey } from '@/lib/dates';

import { toCsv } from './stats';

export type ExportResult = 'shared' | 'empty' | 'error';

/** Writes every day from the first log to today as CSV and opens the share sheet (Premium). */
export async function exportCsv(): Promise<ExportResult> {
  const db = getDb();
  const first = getFirstDate(db);
  if (!first) return 'empty';
  const today = todayKey();
  try {
    const file = new File(Paths.cache, `pebblesip-${today}.csv`);
    if (file.exists) file.delete();
    file.create();
    file.write(toCsv(getRange(db, first, today)));
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Pebblesip data',
      UTI: 'public.comma-separated-values-text',
    });
    return 'shared';
  } catch {
    return 'error';
  }
}
