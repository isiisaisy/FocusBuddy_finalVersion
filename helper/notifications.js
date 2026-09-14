// Expo Notifications API for scheduling and managing local notifications
import * as Notifications from "expo-notifications";
// Platform is used to distinguish between Android and iOS behavior
import { Platform } from "react-native";


// Notifications auch wenn App aktiv
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,// Show alert banner
    shouldPlaySound: false,// No sound
    shouldSetBadge: false,
  }),
});

// Channel nur einmal setzen (Android-only)
let channelReady = false;

//Android Channel
async function ensureAndroidChannel() {
  if (Platform.OS !== "android" || channelReady) return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  channelReady = true;
}

// Permission holen
export async function ensureNotificationPermission() {
  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

//Validates and parses a time string in the format "HH:MM"
export function parseTimeHHMM(text) {
  const t = text.trim();
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t);
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

//alten Notifications löschen
export async function cancelReminderIds(ids) {
  if (!Array.isArray(ids)) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
    }
  }
}

// Reminder planen
export async function scheduleReminderForHabit({
  habitId,
  title,
  frequency,
  daysOfWeek,
  hour,
  minute,
}) {
    //Permission und Channel prüfem
    const ok = await ensureNotificationPermission();
    if (!ok) return [];

  // Notification content (shown to the user)
  const content = {
    title: "FocusBuddy Reminder",
    body: `Time for: ${title}`,
    data: { habitId },
    ...(Platform.OS === "android" ? { android: { channelId: "default" } } : {}),
  };

  // Daily Reminder
  if (frequency === "daily") {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { hour, minute, repeats: true },
    });
    return [id];
  }

  // Weekly Reminder
  const selected = Array.isArray(daysOfWeek) ? daysOfWeek : [];
  if (selected.length === 0) {
    // fallback: wenn nichts gewählt wird automatisch täglich
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { hour, minute, repeats: true },
    });
    return [id];
  }

  const ids = [];
  for (const dayIndex of selected) {
   // Convert JS weekday (0=Sunday) to Expo weekday (1=Sunday)
    const weekday = dayIndex === 0 ? 1 : dayIndex + 1;

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { weekday, hour, minute, repeats: true },
    });
    ids.push(id);
  }
  return ids;
}
