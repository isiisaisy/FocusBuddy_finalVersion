jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3, MAX: 4 },
}));

import * as Notifications from "expo-notifications";
import {
  parseTimeHHMM,
  ensureNotificationPermission,
  scheduleReminderForHabit,
} from "../helper/notifications";

beforeEach(() => {
  jest.clearAllMocks();
});

test("parseTimeHHMM valid", () => {
  expect(parseTimeHHMM("08:30")).toEqual({ hour: 8, minute: 30 });
});

test("parseTimeHHMM invalid", () => {
  expect(parseTimeHHMM("8:30")).toBeNull();
  expect(parseTimeHHMM("24:00")).toBeNull();
  expect(parseTimeHHMM("aa:bb")).toBeNull();
});

test("ensureNotificationPermission returns true when already granted", async () => {
  Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });

  const ok = await ensureNotificationPermission();
  expect(ok).toBe(true);
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});

test("ensureNotificationPermission requests permission if not granted", async () => {
  Notifications.getPermissionsAsync.mockResolvedValue({ status: "denied" });
  Notifications.requestPermissionsAsync.mockResolvedValue({
    status: "granted",
  });

  const ok = await ensureNotificationPermission();
  expect(ok).toBe(true);
  expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
});

test("scheduleReminderForHabit daily schedules once", async () => {
  Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
  Notifications.scheduleNotificationAsync.mockResolvedValue("id1");

  const ids = await scheduleReminderForHabit({
    habitId: "h1",
    title: "Run",
    frequency: "daily",
    daysOfWeek: [],
    hour: 9,
    minute: 15,
  });

  expect(ids).toEqual(["id1"]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(
    Notifications.scheduleNotificationAsync.mock.calls[0][0].trigger,
  ).toEqual({
    hour: 9,
    minute: 15,
    repeats: true,
  });
});

test("scheduleReminderForHabit weekly with empty selection falls back to daily", async () => {
  Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
  Notifications.scheduleNotificationAsync.mockResolvedValue("id1");

  const ids = await scheduleReminderForHabit({
    habitId: "h1",
    title: "Read",
    frequency: "weekly",
    daysOfWeek: [],
    hour: 7,
    minute: 0,
  });

  expect(ids).toEqual(["id1"]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

test("scheduleReminderForHabit weekly schedules for each selected day", async () => {
  Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });
  Notifications.scheduleNotificationAsync
    .mockResolvedValueOnce("a")
    .mockResolvedValueOnce("b");

  const ids = await scheduleReminderForHabit({
    habitId: "h1",
    title: "Gym",
    frequency: "weekly",
    daysOfWeek: [1, 3],
    hour: 18,
    minute: 30,
  });

  expect(ids).toEqual(["a", "b"]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);

  expect(
    Notifications.scheduleNotificationAsync.mock.calls[0][0].trigger,
  ).toEqual({
    weekday: 2,
    hour: 18,
    minute: 30,
    repeats: true,
  });
  expect(
    Notifications.scheduleNotificationAsync.mock.calls[1][0].trigger,
  ).toEqual({
    weekday: 4,
    hour: 18,
    minute: 30,
    repeats: true,
  });
});
