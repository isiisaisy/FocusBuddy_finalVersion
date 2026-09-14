import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadHabits, saveHabits } from "../storage/habitStorage";

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

test("loadHabits returns [] if empty", async () => {
  const res = await loadHabits();
  expect(res).toEqual([]);
});

test("saveHabits stores JSON", async () => {
  const data = [{ id: "1", title: "Test" }];
  await saveHabits(data);
  expect(AsyncStorage.setItem).toHaveBeenCalled();
});

test("loadHabits normalizes missing fields", async () => {
  // daysOfWeek fehlt -> normalizeHabit sollte Defaults setzen
  await AsyncStorage.setItem(
    "habits",
    JSON.stringify([{ id: "1", title: "X", frequency: "daily" }]),
  );

  const res = await loadHabits();
  expect(res[0].daysOfWeek).toEqual([]);
  expect(res[0].habitDoneByDate).toEqual({});
  expect(res[0].miniStepDoneByDate).toEqual({});
  expect(res[0].reminderTime).toBe(null);
  expect(res[0].reminderNotificationIds).toEqual([]);
});
