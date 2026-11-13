import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  type PurchasesPackage,
} from 'react-native-purchases';

import { getDb, getSetting, setSetting } from '@/db';
import { syncReminders } from '@/features/reminders/reminders';
import { refreshWidgets } from '@/features/widgets/widget-task-handler';

import { notifyPremiumChanged, PREMIUM_CACHE_KEY } from './use-premium';

/** RevenueCat entitlement that unlocks everything (monthly, yearly and lifetime all grant it). */
export const ENTITLEMENT_ID = 'premium';
const API_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

let configured = false;

/** False until a RevenueCat key is set in `.env.local` (then the app stays free). */
export function purchasesAvailable(): boolean {
  return Platform.OS === 'android' && API_KEY.length > 0;
}

/** Stores the entitlement locally; when it changes, re-sync reminders and widgets. */
export function applyCustomerInfo(info: CustomerInfo): boolean {
  const active = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  const db = getDb();
  const was = getSetting(db, PREMIUM_CACHE_KEY) === '1';
  if (active !== was) {
    setSetting(db, PREMIUM_CACHE_KEY, active ? '1' : '0');
    notifyPremiumChanged();
    void syncReminders();
    void refreshWidgets();
  }
  return active;
}

/** Configures RevenueCat once on app start and keeps the cached entitlement current. */
export async function initPurchases(): Promise<void> {
  if (configured || !purchasesAvailable()) return;
  if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
  Purchases.addCustomerInfoUpdateListener((info) => void applyCustomerInfo(info));
  try {
    applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {
    // Offline: keep the cached value.
  }
}

export type PlanId = 'yearly' | 'monthly' | 'lifetime';

export interface Plan {
  id: PlanId;
  pkg: PurchasesPackage;
  /** Localized by Google Play, e.g. "₹399.00". */
  price: string;
  /** e.g. "3-day free trial" when the yearly product has an intro offer. */
  trial: string | null;
}

const TYPE_TO_PLAN: Partial<Record<PACKAGE_TYPE, PlanId>> = {
  [PACKAGE_TYPE.ANNUAL]: 'yearly',
  [PACKAGE_TYPE.MONTHLY]: 'monthly',
  [PACKAGE_TYPE.LIFETIME]: 'lifetime',
};

function trialLabel(pkg: PurchasesPackage): string | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unit = intro.periodUnit.toLowerCase();
  return `${intro.periodNumberOfUnits}-${unit} free trial`;
}

/** Plans from the current RevenueCat offering, yearly first. Empty if not configured or offline. */
export async function loadPlans(): Promise<Plan[]> {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  const plans: Plan[] = [];
  for (const pkg of offerings.current?.availablePackages ?? []) {
    const id = TYPE_TO_PLAN[pkg.packageType];
    if (id) plans.push({ id, pkg, price: pkg.product.priceString, trial: trialLabel(pkg) });
  }
  const order: PlanId[] = ['yearly', 'monthly', 'lifetime'];
  return plans.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

export type PurchaseResult = 'success' | 'cancelled' | 'error';

export async function buy(plan: Plan): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return applyCustomerInfo(customerInfo) ? 'success' : 'error';
  } catch (e) {
    return (e as { userCancelled?: boolean }).userCancelled ? 'cancelled' : 'error';
  }
}

/** Restores purchases from the Google account; true if Premium is now active. */
export async function restore(): Promise<boolean> {
  if (!configured) return false;
  return applyCustomerInfo(await Purchases.restorePurchases());
}
