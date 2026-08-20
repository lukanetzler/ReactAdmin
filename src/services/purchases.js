import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

// Public RevenueCat SDK keys. These are designed to ship inside the client binary,
// so they live in source rather than .env — that keeps a fresh clone buildable and
// avoids the iOS/Android split that previously had one key here and one in .env.
const IOS_KEY = 'appl_JAWIKFkSQyNwQzxvBCXxvcopfEI';
const ANDROID_KEY = 'goog_hQLSakLSMNbbvATbLQtURPPHzxO';

// Optional escape hatch for RevenueCat's Test Store. Put VITE_RC_TEST_KEY=test_…
// in .env to point every platform at the sandbox, and remove it to go back to the
// real stores. Editing this file to switch is what caused the stale-key confusion.
const TEST_KEY = import.meta.env.VITE_RC_TEST_KEY ?? '';

const ENTITLEMENT_ID = 'Prayvail Supporter';

export const isNative = () => Capacitor.isNativePlatform();

function getApiKey() {
  if (TEST_KEY) return TEST_KEY;
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
 * Tri-state entitlement check: 'active' | 'inactive' | 'unknown'.
 *
 * The distinction matters. A transient network or RevenueCat error must never be
 * mistaken for a lapsed subscription, or we would revoke access from someone who
 * is paying. Only 'inactive' is a definitive "not a supporter". On web there is no
 * RevenueCat SDK at all, so the honest answer is always 'unknown'.
 */
export async function getSupporterStatus() {
  if (!isNative()) return 'unknown';
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
      ? 'active'
      : 'inactive';
  } catch {
    return 'unknown';
  }
}

/**
 * Returns true only if the entitlement is definitively active.
 */
export async function checkIsSupporter() {
  return (await getSupporterStatus()) === 'active';
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
    // NOTE: getOfferings() resolves to PurchasesOfferings DIRECTLY ({ all, current }).
    // It is not wrapped in { offerings } the way getCustomerInfo/restorePurchases are.
    // Destructuring it as { offerings } yields undefined and throws on the next line.
    const offerings = await Purchases.getOfferings();

    // `offerings.current` is whichever offering is flagged **Current** in the
    // RevenueCat dashboard. A freshly created offering is NOT current until you
    // mark it, which otherwise shows users an empty paywall over what is really
    // just a dashboard setting. So fall back to any offering that has packages.
    const all = Object.values(offerings.all ?? {});
    const chosen =
      (offerings.current?.availablePackages?.length ? offerings.current : null)
      ?? all.find(o => o?.availablePackages?.length)
      ?? null;

    if (!chosen) {
      const summary = all.length
        ? all.map(o => `${o.identifier}(${o.availablePackages?.length ?? 0} pkgs)`).join(', ')
        : '(no offerings returned at all)';
      console.warn('[RC] no offering with packages —', summary);
      return [];
    }

    if (!offerings.current) {
      console.warn(`[RC] no Current offering set; falling back to "${chosen.identifier}". Mark it Current in RevenueCat.`);
    }
    return chosen.availablePackages ?? [];
  } catch (e) {
    // Previously swallowed, which made a misconfigured paywall impossible to debug.
    console.warn('[RC] getOfferings failed:', e);
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
