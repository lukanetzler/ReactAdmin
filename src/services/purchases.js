import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

const IOS_KEY = 'appl_JAWIKFkSQyNwQzxvBCXxvcopfEI';
const ANDROID_KEY = import.meta.env.VITE_RC_ANDROID_KEY ?? '';
const ENTITLEMENT_ID = 'PrayVail Supporter';

export const isNative = () => Capacitor.isNativePlatform();

function getApiKey() {
  return Capacitor.getPlatform() === 'android' ? ANDROID_KEY : IOS_KEY;
}

/**
 * Call once after Firebase auth resolves. Pass the Firebase UID so RevenueCat
 * can link anonymous and named users across devices.
 */
export async function initializePurchases(userId) {
  if (!isNative()) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[RC] no API key configured for platform:', Capacitor.getPlatform());
    return;
  }
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey, appUserID: userId ?? null });
  } catch (e) {
    console.warn('[RC] init failed:', e);
  }
}

/**
 * Returns true if the current user has an active "PrayVail Supporter" entitlement.
 */
export async function checkIsSupporter() {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Present the RevenueCat paywall (configured in the RC dashboard).
 * Returns true if the user completed a purchase or restore.
 */
export async function presentPaywall() {
  if (!isNative()) return false;
  try {
    const { result } = await RevenueCatUI.presentPaywall();
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  } catch {
    return false;
  }
}

/**
 * Present the RevenueCat Customer Center (manage / cancel subscription).
 */
export async function presentCustomerCenter() {
  if (!isNative()) return;
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (e) {
    console.warn('[RC] customer center failed:', e);
  }
}

/**
 * Fetch the current RevenueCat offerings. Returns an array of packages:
 * [{ identifier, packageType, product: { title, description, priceString, price, currencyCode, subscriptionPeriod } }]
 * Falls back to [] on error or non-native.
 */
const DEV_MOCK_PACKAGES = [
  {
    identifier: 'monthly',
    packageType: 'MONTHLY',
    product: { title: 'Supporter Monthly', description: 'Full access, billed monthly', priceString: '£3.99', price: 3.99, currencyCode: 'GBP', subscriptionPeriod: 'P1M' },
  },
  {
    identifier: 'annual',
    packageType: 'ANNUAL',
    product: { title: 'Supporter Annual', description: 'Full access, billed annually', priceString: '£39.99', price: 39.99, currencyCode: 'GBP', subscriptionPeriod: 'P1Y' },
  },
];

export async function getOfferings() {
  if (!isNative()) return DEV_MOCK_PACKAGES;
  try {
    const { offerings } = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages ?? [];
  } catch {
    return [];
  }
}

/**
 * Purchase a specific package returned by getOfferings().
 * Returns true if the purchase completed successfully.
 */
export async function purchasePackage(pkg) {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (e) {
    if (e?.code === 'PURCHASE_CANCELLED') return false;
    throw e;
  }
}

/**
 * Restore purchases — useful when a user reinstalls or switches devices.
 * Returns true if a supporter entitlement was found after restoring.
 */
export async function restorePurchases() {
  if (!isNative()) return false;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}
