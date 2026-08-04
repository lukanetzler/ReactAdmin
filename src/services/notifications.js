import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

// Deep-links to the OS settings where the user can re-enable notifications.
// Android opens the app's notification screen directly; iOS opens the app settings
// page (Apple doesn't allow linking straight to the notification sub-screen).
export async function openNotificationSettings() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeSettings.open({
      optionAndroid: AndroidSettings.AppNotification,
      optionIOS: IOSSettings.App,
    });
  } catch (err) {
    console.error('Failed to open notification settings:', err);
  }
}

const ID_DAILY_BREAD = 1;
const ID_REFLECTION = 2;

// Resolves the OS permission without nagging: only shows the system dialog the first
// time (state 'prompt'). Once granted or denied, returns the stored decision silently.
async function ensurePermission() {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return 'granted';
  if (current.display === 'denied') return 'denied';
  const requested = await LocalNotifications.requestPermissions();
  return requested.display; // 'granted' | 'denied'
}

async function scheduleRepeating(id, title, body, hour, minute) {
  await LocalNotifications.schedule({
    notifications: [{
      id,
      title,
      body,
      schedule: {
        on: { hour, minute, second: 0 },
        repeats: true,
        allowWhileIdle: true,
      },
      sound: undefined, // uses system default
    }],
  });
}

// Returns { permission } where permission is 'granted' | 'denied' | 'unsupported'.
// The caller can use this to keep the UI honest (e.g. revert a toggle the OS won't allow).
export async function syncNotifications({ notifDailyVerse = true, notifReflection = true } = {}) {
  if (!Capacitor.isNativePlatform()) return { permission: 'unsupported' };

  // Only prompt/schedule when something is being enabled. Turning everything off needs
  // no permission — we just clear whatever is scheduled.
  const wantsAny = notifDailyVerse || notifReflection;
  const permission = wantsAny ? await ensurePermission() : 'granted';

  if (permission !== 'granted') {
    // Can't schedule — make sure nothing lingers, then report back.
    await LocalNotifications.cancel({
      notifications: [{ id: ID_DAILY_BREAD }, { id: ID_REFLECTION }],
    }).catch(() => {});
    return { permission };
  }

  // Clear both, then reschedule only the enabled ones — this is what makes a toggle-off final.
  await LocalNotifications.cancel({
    notifications: [{ id: ID_DAILY_BREAD }, { id: ID_REFLECTION }],
  });

  if (notifDailyVerse) {
    await scheduleRepeating(
      ID_DAILY_BREAD,
      'Morning Word',
      'Your daily verse is waiting. Begin with a word.',
      8, 0,
    );
  }

  if (notifReflection) {
    await scheduleRepeating(
      ID_REFLECTION,
      'Evening Reflection',
      'Take a moment before the day closes. Your journal is open.',
      20, 0,
    );
  }

  return { permission: 'granted' };
}
