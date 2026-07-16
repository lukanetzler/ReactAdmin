import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ID_DAILY_BREAD = 1;
const ID_REFLECTION = 2;

async function ensurePermission() {
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted';
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

export async function syncNotifications({ notifDailyVerse = true, notifReflection = true } = {}) {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await ensurePermission();
  if (!granted) return;

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
}
