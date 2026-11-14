/**
 * External links (Settings → About). TODO before closed testing: fill these in.
 * A row whose link is null is hidden, so nothing broken ships.
 */
export const LINKS = {
  privacyPolicy: null as string | null, // e.g. 'https://pebblesip.app/privacy'
  terms: null as string | null, // e.g. 'https://pebblesip.app/terms'
  supportEmail: null as string | null, // e.g. 'hello@pebblesip.app'
  /** Play listing; works once the app is published (closed testing included). */
  playStore: 'https://play.google.com/store/apps/details?id=com.salmanshaikh.pebblesip',
};
