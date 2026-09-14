// AsyncStorage is used to persist data locally on the device
// This acts as a simple local database for habits
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDateKey } from "../helper/date";

// Storage key under which all habits are saved
const KEY = "habits";

// Wandelt Date in Datum Forat YYYY-MM-DD um erledigt pro Tag speichern
function getTodayDayIndex() {
  return new Date().getDay();
}

function normalizeHabit(habit) {
 habit.miniSteps = Array.isArray(habit.miniSteps)
   ? habit.miniSteps.map((step, index) => ({
       id: step.id || `${habit.id}-step-${index}`,
       title: typeof step === "string" ? step : step.title,
       doneByDate: step.doneByDate || {},
     }))
   : habit.miniStep
     ? [{ id: `${habit.id}-step-0`, title: habit.miniStep, doneByDate: {} }]
     : [];

 if (!Array.isArray(habit.daysOfWeek)) {
   habit.daysOfWeek = habit.frequency === "weekly" ? [getTodayDayIndex()] : [];

   // daysOfWeek sicherstellen
   if (!Array.isArray(habit.daysOfWeek)) {
     habit.daysOfWeek =
       habit.frequency === "weekly" ? [new Date().getDay()] : [];
   }
 }

 // Done-Objekte sicherstellen
 habit.miniStepDoneByDate = habit.miniStepDoneByDate ?? {};
 habit.habitDoneByDate = habit.habitDoneByDate ?? {};

 // Reminder IMMER sicherstellen
 habit.reminderTime = habit.reminderTime ?? null;
 habit.reminderNotificationIds = habit.reminderNotificationIds ?? [];

  return habit;
}

function isPlannedForToday(habit, date = new Date()) {
  const day = date.getDay(); 

  if (!habit.schedule) return true; // fallback

  if (habit.schedule.type === "daily") return true;

  if (habit.schedule.type === "weekly") {
    return (habit.schedule.daysOfWeek || []).includes(day);
  }

  return true;
}

export async function loadHabits() {
  // String aus dem Speicher holen
  const json = await AsyncStorage.getItem(KEY);

  // nichts gespeichert? leere Liste zurück
  const habits = json ? JSON.parse(json) : [];

  // Habits normalisieren, damit neue Felder nicht undefined sind
  const normalized = habits.map(normalizeHabit);
  console.log("Loaded habits:", normalized.map(h => ({ id: h.id, title: h.title, reminderTime: h.reminderTime })));
  return normalized;
}
//saveHabits
export async function saveHabits(habits) {
  // Habits als JSON-String speichern
  console.log("Saving habits to storage:", habits.map(h => ({ id: h.id, title: h.title, reminderTime: h.reminderTime })));
  await AsyncStorage.setItem(KEY, JSON.stringify(habits));
  console.log("Habits saved successfully");
}
