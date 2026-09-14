import {
  Alert,
  Button,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import HeaderLogo from "../components/HeaderLogo";
import { createHabit } from "../models/Habit";
import { loadHabits, saveHabits } from "../storage/habitStorage";
import {
  cancelReminderIds,
  ensureNotificationPermission,
  parseTimeHHMM,
  scheduleReminderForHabit,
} from "../helper/notifications";

const COLORS = { background: "#DEDAFF", primary: "#6631D7" };
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
);
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export default function AddHabitScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const editingId = route.params?.habitId || null;
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [miniSteps, setMiniSteps] = useState([]);
  const [reminderTime, setReminderTime] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalReward, setGoalReward] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  useEffect(() => {
    loadHabits().then((data) => {
      setHabits(data);
      const habit = data.find((item) => item.id === editingId);
      if (!habit) return;
      setTitle(habit.title);
      setFrequency(habit.frequency || "daily");
      setDaysOfWeek(habit.daysOfWeek || []);
      setMiniSteps(habit.miniSteps || []);
      setReminderTime(habit.reminderTime || "");
      setGoalTitle(habit.goal?.title || "");
      setGoalReward(habit.goal?.reward || "");
      setGoalTarget(habit.goal?.target ? String(habit.goal.target) : "");
    });
  }, [editingId]);

  function addMiniStep() {
    setMiniSteps((steps) => [
      ...steps,
      { id: `${Date.now()}-${steps.length}`, title: "", doneByDate: {} },
    ]);
  }

  function updateMiniStep(id, titleText) {
    setMiniSteps((steps) =>
      steps.map((step) => (step.id === id ? { ...step, title: titleText } : step))
    );
  }

  function removeMiniStep(id) {
    setMiniSteps((steps) => steps.filter((step) => step.id !== id));
  }

  function toggleDay(dayIndex) {
    setDaysOfWeek((days) => {
      const next = days.includes(dayIndex)
        ? days.filter((day) => day !== dayIndex)
        : [...days, dayIndex];
      return next.sort((a, b) => a - b);
    });
  }

  async function saveHabit() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Habit Titel hier eingeben.");
      return;
    }

    const time = reminderTime.trim();
    const parsed = time ? parseTimeHHMM(time) : null;
    if (time && !parsed) {
      Alert.alert("Ungültige Zeit", "Bitte im Format HH:MM eingeben (z.B. 08:30).");
      return;
    }

    const cleanedSteps = miniSteps
      .filter((step) => step.title.trim())
      .map((step) => ({ ...step, title: step.title.trim() }));
    let updatedHabits;

    if (editingId) {
      updatedHabits = habits.map((habit) =>
        habit.id === editingId
          ? {
              ...habit,
              title: title.trim(),
              category: null,
              frequency,
              daysOfWeek: frequency === "weekly" ? daysOfWeek : [],
              miniSteps: cleanedSteps,
              miniStep: cleanedSteps[0]?.title || "",
              reminderTime: time || null,
              goal: goalTitle.trim()
                ? {
                    ...(habit.goal || {}),
                    title: goalTitle.trim(),
                    reward: goalReward.trim(),
                    target: Number(goalTarget) || 10,
                  }
                : null,
            }
          : habit
      );
    } else {
      const newHabit = createHabit({
        title: title.trim(),
        category: null,
        frequency,
        miniSteps: cleanedSteps,
        daysOfWeek: frequency === "weekly" ? daysOfWeek : [],
      });
      newHabit.reminderTime = time || null;
      newHabit.goal = goalTitle.trim()
        ? {
            title: goalTitle.trim(),
            reward: goalReward.trim(),
            target: Number(goalTarget) || 10,
            stars: 0,
          }
        : null;
      updatedHabits = [...habits, newHabit];
    }

    const habitId = editingId || updatedHabits.at(-1).id;
    const oldHabit = habits.find((habit) => habit.id === habitId);

    // Benachrichtigungen sind optional (z.B. auf Web nicht verfügbar), Speichern darf davon nicht abhängen
    let reminderNotificationIds = [];
    try {
      await cancelReminderIds(oldHabit?.reminderNotificationIds || []);

      if (parsed) {
        const allowed = await ensureNotificationPermission();
        if (allowed) {
          const habit = updatedHabits.find((item) => item.id === habitId);
          reminderNotificationIds = await scheduleReminderForHabit({
            habitId,
            title: habit.title,
            frequency: habit.frequency,
            daysOfWeek: habit.daysOfWeek,
            hour: parsed.hour,
            minute: parsed.minute,
          });
        }
      }
    } catch (e) {
      console.warn("Could not manage reminder notifications:", e);
    }

    updatedHabits = updatedHabits.map((habit) =>
      habit.id === habitId ? { ...habit, reminderNotificationIds } : habit
    );
    await saveHabits(updatedHabits);
    navigation.goBack();
  }

  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <HeaderLogo compact />
        <View style={styles.formCard}>
          <Text style={styles.title}>{editingId ? "Habit bearbeiten" : "Neues Habit"}</Text>

      <Text style={styles.label}>Habit-Titel</Text>
      <TextInput style={styles.input} placeholder="Habit title" value={title} onChangeText={setTitle} />
      <Text style={styles.sectionTitle}>Mini-Steps</Text>
      <Text style={{ color: "#555", marginVertical: 6 }}>
        Füge für jede Wiederholung einen Schritt hinzu. Jeder Schritt kann einzeln abgehakt werden.
      </Text>
      {miniSteps.map((step, index) => (
        <View key={step.id} style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            placeholder={`Mini-Schritt ${index + 1}`}
            value={step.title}
            onChangeText={(text) => updateMiniStep(step.id, text)}
            style={styles.stepInput}
          />
          <Pressable onPress={() => removeMiniStep(step.id)} style={{ padding: 10 }}>
            <Text style={{ color: "#D32F2F", fontWeight: "bold" }}>Löschen</Text>
          </Pressable>
        </View>
      ))}
      <Pressable style={styles.addMiniStepButton} onPress={addMiniStep}>
        <Text style={styles.addMiniStepText}>＋ Mini-Step hinzufügen</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Häufigkeit</Text>
      <View style={styles.frequencyRow}>
        <Pressable
          style={[styles.frequencyButton, frequency === "daily" && styles.frequencyButtonActive]}
          onPress={() => setFrequency("daily")}
        >
          <Text style={[styles.frequencyText, frequency === "daily" && styles.frequencyTextActive]}>Täglich</Text>
        </Pressable>
        <Pressable
          style={[styles.frequencyButton, frequency === "weekly" && styles.frequencyButtonActive]}
          onPress={() => {
            setFrequency("weekly");
            if (!daysOfWeek.length) setDaysOfWeek([new Date().getDay()]);
          }}
        >
          <Text style={[styles.frequencyText, frequency === "weekly" && styles.frequencyTextActive]}>Mehrmals pro Woche</Text>
        </Pressable>
      </View>

      {frequency === "weekly" && (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {WEEKDAYS.map((label, index) => {
            const selected = daysOfWeek.includes(index);
            return (
              <Pressable
                key={label}
                onPress={() => toggleDay(index)}
                style={{
                  padding: 10,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: selected ? COLORS.primary : "#E7E7E7",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: selected ? "white" : "#333" }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Erinnerungszeit</Text>
      <TimeStepper value={reminderTime} onChange={setReminderTime} />

      <Text style={styles.sectionTitle}>Ziel verknüpfen</Text>
      <Text style={styles.helper}>Jedes erledigte Habit kann einen Stern für dieses Ziel sammeln.</Text>
      <TextInput style={styles.input} placeholder="Mein Ziel (z. B. 10x laufen gehen)" value={goalTitle} onChangeText={setGoalTitle} />
      <TextInput style={styles.input} placeholder="Meine Belohnung (optional)" value={goalReward} onChangeText={setGoalReward} />
      <TextInput
        placeholder="Anzahl der zu sammelnden Sterne"
        value={goalTarget}
        onChangeText={(text) => setGoalTarget(text.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        style={styles.input}
      />

      <View style={styles.submitButton}>
        <Button title={editingId ? "Save Habit" : "Speichern"} onPress={saveHabit} color={COLORS.primary} />
      </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function TimeStepper({ value, onChange }) {
  const [hourText, minuteText] = value ? value.split(":") : ["08", "00"];
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const reminderEnabled = Boolean(value);

  function updateTime(nextHour, nextMinute) {
    onChange(
      `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`
    );
  }

  return (
    <View style={styles.timeStepperRow}>
      <TimePart
        value={String(hour).padStart(2, "0")}
        disabled={!reminderEnabled}
        onUp={() => updateTime((hour + 1) % 24, minute)}
        onDown={() => updateTime((hour + 23) % 24, minute)}
      />
      <Text style={styles.timeSeparator}>:</Text>
      <TimePart
        value={String(minute).padStart(2, "0")}
        disabled={!reminderEnabled}
        onUp={() => {
          const next = (minute + 5) % 60;
          updateTime(next === 0 ? (hour + 1) % 24 : hour, next);
        }}
        onDown={() => {
          const next = (minute + 55) % 60;
          updateTime(next === 55 ? (hour + 23) % 24 : hour, next);
        }}
      />
      <View style={styles.reminderOptions}>
        <RadioOption
          label="Erinnerung setzen"
          selected={reminderEnabled}
          onPress={() => onChange(value || "08:00")}
        />
        <RadioOption
          label="Keine Erinnerung"
          selected={!reminderEnabled}
          onPress={() => onChange("")}
        />
      </View>
    </View>
  );
}

function TimePart({ value, onUp, onDown, disabled }) {
  return (
    <View style={[styles.timePart, disabled && styles.timePartDisabled]}>
      <Pressable disabled={disabled} onPress={onUp} style={styles.arrowButton}>
        <Text style={styles.arrow}>▲</Text>
      </Pressable>
      <Text style={styles.timeValue}>{value}</Text>
      <Pressable disabled={disabled} onPress={onDown} style={styles.arrowButton}>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>
    </View>
  );
}

function RadioOption({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.radioOption}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  page: { flexGrow: 1, padding: 16, paddingBottom: 32 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18 },
  title: { color: "#3A236D", fontSize: 23, fontWeight: "800", marginBottom: 8 },
  input: { backgroundColor: "#FFFFFF", borderColor: "#D8CDF7", borderRadius: 9, borderWidth: 1, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 12 },
  stepInput: { backgroundColor: "#FFFFFF", borderColor: "#D8CDF7", borderRadius: 9, borderWidth: 1, flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  submitButton: { borderRadius: 10, marginTop: 18, overflow: "hidden" },
  addMiniStepButton: {
    alignItems: "center",
    backgroundColor: "#F8F6FF",
    borderColor: "#C9C4FF",
    borderRadius: 9,
    borderWidth: 1,
    marginTop: 8,
    paddingVertical: 12,
  },
  addMiniStepText: { color: COLORS.primary, fontWeight: "700" },
  frequencyRow: { flexDirection: "row", gap: 8, marginVertical: 8 },
  frequencyButton: {
    alignItems: "center",
    backgroundColor: "#F0EBFF",
    borderColor: "#C9C4FF",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  frequencyButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  frequencyText: { color: COLORS.primary, fontWeight: "700" },
  frequencyTextActive: { color: "#FFFFFF" },
  timeStepperRow: { alignItems: "center", flexDirection: "row", marginBottom: 8 },
  timePart: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#C9C4FF",
    borderRadius: 9,
    borderWidth: 1,
    minWidth: 74,
    paddingVertical: 4,
  },
  timePartDisabled: { opacity: 0.45 },
  arrowButton: { paddingHorizontal: 24, paddingVertical: 3 },
  arrow: { color: COLORS.primary, fontSize: 12 },
  timeValue: { color: "#2B1857", fontSize: 20, fontWeight: "700", paddingVertical: 2 },
  timeSeparator: { color: "#3A236D", fontSize: 22, fontWeight: "800", marginHorizontal: 7 },
  reminderOptions: { marginLeft: 12 },
  radioOption: { alignItems: "center", flexDirection: "row", marginVertical: 4 },
  radio: {
    alignItems: "center",
    borderColor: "#8B5CF6",
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    marginRight: 7,
    width: 20,
  },
  radioSelected: { backgroundColor: "#FFFFFF" },
  radioDot: { backgroundColor: COLORS.primary, borderRadius: 5, height: 10, width: 10 },
  radioLabel: { color: "#3A236D", fontSize: 12, fontWeight: "600" },
  label: { color: "#3A236D", fontWeight: "700", marginTop: 12, marginBottom: 6 },
  sectionTitle: { color: "#3A236D", fontSize: 18, fontWeight: "700", marginTop: 18 },
  helper: { color: "#5E4B85", marginVertical: 6 },
  select: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#C9C4FF",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    padding: 13,
  },
  selectText: { color: "#2B1857", fontWeight: "600" },
  placeholder: { color: "#777" },
  chevron: { color: COLORS.primary, fontSize: 18, fontWeight: "700" },
  modalOverlay: { alignItems: "center", backgroundColor: "rgba(20, 13, 38, 0.55)", flex: 1, justifyContent: "center", padding: 20 },
  dropdown: { backgroundColor: "#FFFFFF", borderRadius: 14, maxWidth: 430, padding: 16, width: "100%" },
  dropdownTitle: { color: "#3A236D", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  option: { borderBottomColor: "#EEE8FF", borderBottomWidth: 1, paddingVertical: 12 },
  optionText: { color: "#2B1857", fontWeight: "600" },
  timeRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  timeHour: { color: "#3A236D", fontWeight: "700", width: 35 },
  minuteOption: { backgroundColor: "#EEE8FF", borderRadius: 6, margin: 2, paddingHorizontal: 7, paddingVertical: 6 },
};
