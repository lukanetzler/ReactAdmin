import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

const API_KEY = 'test_GKdzMwRzmSDqrsgSloXdxKfrkXD';
const ENTITLEMENT_ID = 'PrayVail Supporter';

export const isNative = () => Capacitor.isNativePlatform();

/**
 * Call once after Firebase auth resolves. Pass the Firebase UID so RevenueCat
 * can link anonymous and named users across devices.
 */
export async function initializePurchases(userId) {
  if (!isNative()) return;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({ apiKey: API_KEY, appUserID: userId ?? null });
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
