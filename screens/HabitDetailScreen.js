import { ImageBackground, View, Text, Button, TextInput, Alert, Pressable, ScrollView, Platform } from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
// Repository functions for loading and saving habits
import { loadHabits, saveHabits } from "../storage/habitStorage";
import { getDateKey } from "../helper/date";
import HeaderLogo from "../components/HeaderLogo";
import GoalCompleteModal from "../components/GoalCompleteModal";
// Notification helper functions
import {
  ensureNotificationPermission,
  parseTimeHHMM,
  cancelReminderIds,
  scheduleReminderForHabit,
} from "../helper/notifications";
import { getMotivationText } from "../helper/motivationText";

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Alert.alert mit Buttons ist auf react-native-web ein No-Op, deshalb hier window.confirm nutzen
function confirmAction(title, message, onConfirm) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", style: "destructive", onPress: onConfirm },
    ]);
  }
}

export default function HabitDetailScreen({ route }) {
  const navigation = useNavigation();
  // Extract habit ID from navigation parameters
  const { habitId } = route.params;
  const todayKey = getDateKey();

  const [habits, setHabits] = useState([]);
  const [habit, setHabit] = useState(null);
  const [reminderTime, setReminderTime] = useState("");
  const [newMiniStep, setNewMiniStep] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalReward, setGoalReward] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalPopup, setGoalPopup] = useState(null);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [motivationTexts, setMotivationTexts] = useState({});
  const savedReminderTime = habit?.reminderTime || "";
  const hasReminderChanges = reminderTime !== savedReminderTime;

  const COLORS = {
    background: "#DEDAFF",
    primary: "#6631D7",
    card: "#FFFFFF",
    border: "#C9C4FF",
    text: "#1B1B1B",
    muted: "#666666",
  };

  async function refreshHabit() {
    const data = await loadHabits();
    const found = data.find((item) => item.id === habitId);
    setHabits(data);
    setHabit(found || null);
    setEditedTitle(found?.title || "");
    setFrequency(found?.frequency || "daily");
    setDaysOfWeek(Array.isArray(found?.daysOfWeek) ? found.daysOfWeek : []);
    setReminderTime(found?.reminderTime || "");
    setGoalTitle(found?.goal?.title || "");
    setGoalReward(found?.goal?.reward || "");
    setGoalTarget(found?.goal?.target ? String(found.goal.target) : "");
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", refreshHabit);
    refreshHabit();
    return unsub;
  }, [habitId, navigation]);

  // Sync reminderTime when habit changes from external updates
  useEffect(() => {
    if (habit) {
      setReminderTime(habit.reminderTime || "");
    }
  }, [habit?.id, habit?.reminderTime]);

  // Toggles one mini-step for today.
  async function toggleMiniStep(stepId) {
    const currentHabit = habits.find((h) => h.id === habitId);
    const currentStep = currentHabit?.miniSteps?.find((s) => s.id === stepId);
    const wasNotDone = !currentStep?.doneByDate?.[todayKey];
    const wasHabitDoneBefore = Boolean(currentHabit?.habitDoneByDate?.[todayKey]);

    let autoCompleted = false;
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const miniSteps = (h.miniSteps || []).map((step) =>
        step.id === stepId
          ? {
              ...step,
              doneByDate: {
                ...(step.doneByDate || {}),
                [todayKey]: !step.doneByDate?.[todayKey],
              },
            }
          : step
      );
      // Habit automatisch als erledigt markieren, wenn alle Mini-Steps fertig sind
      const allMiniStepsDone = miniSteps.length > 0 && miniSteps.every((step) => step.doneByDate?.[todayKey]);
      const habitDoneByDate = { ...(h.habitDoneByDate || {}) };
      if (allMiniStepsDone && !habitDoneByDate[todayKey]) {
        habitDoneByDate[todayKey] = true;
        autoCompleted = true;
      }
      return { ...h, miniSteps, habitDoneByDate };
    });

    setHabits(updated);
    await saveHabits(updated);
    // Update local habit state
    setHabit(updated.find((h) => h.id === habitId));
    
    // Generate and store motivation text when marking as done
    if (wasNotDone) {
      setMotivationTexts((prev) => ({
        ...prev,
        [stepId]: getMotivationText(),
      }));
    }

    if (autoCompleted && !wasHabitDoneBefore) {
      setMotivationTexts((prev) => ({
        ...prev,
        [`habit-${habitId}`]: getMotivationText(),
      }));
      if (currentHabit?.goal?.title) {
        const previousStars = Object.values(currentHabit.habitDoneByDate || {}).filter(Boolean).length;
        const target = Number(currentHabit.goal.target) || 10;
        if (previousStars < target && previousStars + 1 >= target) {
          setGoalPopup(currentHabit.goal);
        }
      }
    }
  }

  async function addMiniStep() {
    const title = newMiniStep.trim();
    if (!title) return;

    const updated = habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            miniSteps: [
              ...(h.miniSteps || []),
              {
                id: `${Date.now()}-${h.miniSteps?.length || 0}`,
                title,
                doneByDate: {},
              },
            ],
          }
        : h
    );
    setHabits(updated);
    await saveHabits(updated);
    setHabit(updated.find((h) => h.id === habitId));
    setNewMiniStep("");
  }

  function toggleDay(dayIndex) {
    setDaysOfWeek((days) => {
      const next = days.includes(dayIndex)
        ? days.filter((day) => day !== dayIndex)
        : [...days, dayIndex];
      return next.sort((a, b) => a - b);
    });
  }

  async function saveDetails() {
    if (!editedTitle.trim()) return;
    setIsSavingDetails(true);
    const updated = habits.map((item) =>
      item.id === habitId
        ? {
            ...item,
            title: editedTitle.trim(),
            frequency,
            daysOfWeek: frequency === "weekly" ? daysOfWeek : [],
            goal: goalTitle.trim()
              ? {
                  ...(item.goal || {}),
                  title: goalTitle.trim(),
                  reward: goalReward.trim(),
                  target: Number(goalTarget) || 10,
                }
              : null,
          }
        : item
    );
    setHabits(updated);
    await saveHabits(updated);
    setHabit(updated.find((item) => item.id === habitId));
    setIsSavingDetails(false);
    navigation.navigate("TodayHabits");
  }

  async function toggleHabitDone() {
    const currentHabit = habits.find((item) => item.id === habitId);
    const wasDone = Boolean(currentHabit?.habitDoneByDate?.[todayKey]);
    const updated = habits.map((item) =>
      item.id === habitId
        ? {
            ...item,
            habitDoneByDate: {
              ...(item.habitDoneByDate || {}),
              [todayKey]: !item.habitDoneByDate?.[todayKey],
            },
          }
        : item
    );
    setHabits(updated);
    await saveHabits(updated);
    setHabit(updated.find((item) => item.id === habitId));
    if (!wasDone) {
      setMotivationTexts((prev) => ({
        ...prev,
        [`habit-${habitId}`]: getMotivationText(),
      }));
    }
    if (!wasDone && currentHabit?.goal?.title) {
      const previousStars = Object.values(currentHabit.habitDoneByDate || {}).filter(Boolean).length;
      const target = Number(currentHabit.goal.target) || 10;
      if (previousStars < target && previousStars + 1 >= target) {
        setGoalPopup(currentHabit.goal);
      }
    }
  }

  function deleteHabit() {
    confirmAction("Habit löschen", "Möchtest du dieses Habit wirklich löschen?", async () => {
      try {
        // Load latest habits from storage to ensure we have current data
        const latestHabits = await loadHabits();

        // Validate that latestHabits is an array
        if (!Array.isArray(latestHabits)) {
          Alert.alert("Fehler", "Habits konnten nicht geladen werden.");
          return;
        }

        // Filter out the habit to delete
        const updated = latestHabits.filter((item) => item.id !== habitId);

        // Try to cancel any reminder notifications
        try {
          await cancelReminderIds(habit?.reminderNotificationIds || []);
        } catch (e) {
          console.warn("Could not cancel reminders:", e);
        }

        // Save updated habits list
        await saveHabits(updated);

        // Navigate back
        navigation.goBack();
      } catch (error) {
        console.error("Error deleting habit:", error);
        Alert.alert("Fehler", "Fehler beim Löschen des Habits: " + error.message);
      }
    });
  }

  // Reminder speichern / ändern
  async function saveReminder() {
    if (!habit) {
      Alert.alert("Fehler", "Habit nicht geladen");
      return;
    }

    const time = reminderTime.trim();
    const parsed = time ? parseTimeHHMM(time) : null;
    if (time && !parsed) {
      Alert.alert("Ungültige Zeit", "Bitte im Format HH:MM eingeben (z.B. 08:30).");
      return;
    }

    setIsSavingReminder(true);

    try {
      const latestHabits = await loadHabits();
      if (!Array.isArray(latestHabits)) {
        Alert.alert("Fehler", "Habits konnten nicht geladen werden.");
        setIsSavingReminder(false);
        return;
      }

      const latestHabit = latestHabits.find((item) => item.id === habitId) || habit;
      if (!latestHabit) {
        Alert.alert("Fehler", "Habit nicht gefunden.");
        setIsSavingReminder(false);
        return;
      }

      // Alte Benachrichtigungen löschen (wenn möglich)
      try {
        await cancelReminderIds(latestHabit?.reminderNotificationIds || []);
      } catch (e) {
        console.warn("Could not cancel reminders:", e);
      }

      // Versuche neue Benachrichtigungen zu schedulen (optional)
      let newIds = [];
      if (parsed) {
        try {
          const allowed = await ensureNotificationPermission();
          if (allowed) {
            const result = await scheduleReminderForHabit({
              habitId,
              title: latestHabit.title,
              frequency: latestHabit.frequency,
              daysOfWeek: latestHabit.daysOfWeek,
              hour: parsed.hour,
              minute: parsed.minute,
            });
            newIds = Array.isArray(result) ? result : [];
          }
        } catch (notifError) {
          console.warn("Could not schedule notification:", notifError);
          // Benachrichtigungen funktionieren nicht, aber Zeit wird trotzdem gespeichert
        }
      }

      // Zeit IMMER speichern, mit oder ohne Benachrichtigungen
      const finalReminderTime = parsed ? time : null;
      const updatedHabit = {
        ...latestHabit,
        reminderTime: finalReminderTime,
        reminderNotificationIds: newIds || [],
      };

      const updated = latestHabits.map((h) =>
        h.id === habitId ? updatedHabit : h
      );

      await saveHabits(updated);

      setHabits(updated);
      setHabit(updatedHabit);
      setReminderTime(finalReminderTime || "");

      // Erfolgs-Nachricht
      if (parsed) {
        Alert.alert("Gespeichert", "Erinnerungszeit wurde gespeichert.");
      } else {
        Alert.alert("Gespeichert", "Erinnerung entfernt.");
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      Alert.alert("Fehler", "Fehler beim Speichern der Erinnerungszeit.");
    } finally {
      setIsSavingReminder(false);
    }
  }

  if (!habit) {
    return <Text>Loading...</Text>;
  }
  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "transparent",
        paddingHorizontal: 16,
        paddingTop: 8,
      }}
    >
      <HeaderLogo compact />

      {/* Titel */}
      <View
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#FFFFFF" }}>
          {habit.title}
        </Text>
      </View>

      {/* Übersicht: Name, Mini-Steps, Erinnerung, Ziel + Sterne */}
      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <Text style={styles.sectionTitle}>Übersicht</Text>

        <Text style={styles.overviewLabel}>Name</Text>
        <Text style={styles.overviewValue}>{habit.title}</Text>

        <Text style={styles.overviewLabel}>Mini-Steps</Text>
        {habit.miniSteps?.length ? (
          habit.miniSteps.map((step) => (
            <Text key={step.id} style={styles.overviewValue}>
              • {step.title}
            </Text>
          ))
        ) : (
          <Text style={styles.overviewValue}>Keine Mini-Steps definiert</Text>
        )}

        <Text style={styles.overviewLabel}>Erinnerung</Text>
        <Text style={styles.overviewValue}>
          {habit.reminderTime ? `⏰ ${habit.reminderTime}` : "Keine Erinnerung gesetzt"}
        </Text>

        {habit.goal?.title ? (
          <>
            <Text style={styles.overviewLabel}>Ziel</Text>
            <Text style={styles.overviewValue}>{habit.goal.title}</Text>
            <Text style={styles.overviewValue}>
              Belohnung: {habit.goal.reward || "Noch keine Belohnung festgelegt"}
            </Text>
            {(() => {
              const stars = Object.values(habit.habitDoneByDate || {}).filter(Boolean).length;
              const target = Number(habit.goal.target) || 10;
              const progress = Math.min(stars / target, 1);
              return (
                <>
                  <View style={styles.starsRow}>
                    {Array.from({ length: target }, (_, index) => (
                      <Text key={index} style={[styles.star, index < stars && styles.starEarned]}>★</Text>
                    ))}
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{stars} / {target} Sterne</Text>
                  {stars >= target && <Text style={styles.completeText}>🎉 Belohnung verdient!</Text>}
                </>
              );
            })()}
          </>
        ) : null}
      </View>

      {/* Heute als erledigt - Checkbox */}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: Boolean(habit.habitDoneByDate?.[todayKey]) }}
        onPress={toggleHabitDone}
        style={{ alignItems: "center", flexDirection: "row", marginBottom: 12 }}
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            borderColor: COLORS.primary,
            borderRadius: 6,
            borderWidth: 2,
            height: 26,
            marginRight: 8,
            width: 26,
            backgroundColor: habit.habitDoneByDate?.[todayKey] ? COLORS.primary : "transparent",
          }}
        >
          {habit.habitDoneByDate?.[todayKey] && (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>✓</Text>
          )}
        </View>
        <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
          {habit.habitDoneByDate?.[todayKey] ? `🎉 ${motivationTexts[`habit-${habitId}`] || "Geschafft! Weiter so!"}` : "Heute als erledigt markieren"}
        </Text>
      </Pressable>

      <View style={styles.editCard}>
        <Text style={styles.sectionTitle}>Habit bearbeiten</Text>
        <TextInput
          value={editedTitle}
          onChangeText={setEditedTitle}
          placeholder="Habit-Name"
          style={styles.input}
        />

        <Text style={styles.sectionTitle}>Häufigkeit</Text>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              marginRight: 8,
              borderRadius: 8,
              backgroundColor: frequency === "daily" ? COLORS.primary : "#E7E7E7",
            }}
            onPress={() => setFrequency("daily")}
          >
            <Text style={{ color: frequency === "daily" ? "#FFFFFF" : "#333", fontWeight: "700" }}>Täglich</Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: frequency === "weekly" ? COLORS.primary : "#E7E7E7",
            }}
            onPress={() => {
              setFrequency("weekly");
              if (!daysOfWeek.length) setDaysOfWeek([new Date().getDay()]);
            }}
          >
            <Text style={{ color: frequency === "weekly" ? "#FFFFFF" : "#333", fontWeight: "700" }}>Mehrmals pro Woche</Text>
          </Pressable>
        </View>

        {frequency === "weekly" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
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
                  <Text style={{ color: selected ? "#FFFFFF" : "#333" }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Reminder */}
        <Text style={styles.sectionTitle}>Erinnerungszeit</Text>
        <TimeStepper value={reminderTime} onChange={setReminderTime} />

        <Pressable
          onPress={saveReminder}
          disabled={isSavingReminder || !hasReminderChanges}
          style={{
            marginTop: 12,
            marginBottom: 12,
            backgroundColor: isSavingReminder || !hasReminderChanges ? "#B8A8E0" : COLORS.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            alignItems: "center",
            opacity: isSavingReminder || !hasReminderChanges ? 0.6 : 1,
          }}
        >
          <Text style={{ color: COLORS.card, fontWeight: "bold" }}>
            {isSavingReminder || !hasReminderChanges ? "✓ Gespeichert" : "Erinnerung speichern"}
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Mini-step</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <TextInput
            placeholder="Mini-Step hinzufügen"
            value={newMiniStep}
            onChangeText={setNewMiniStep}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#FFFFFF",
            }}
          />
          <Pressable
            onPress={addMiniStep}
            style={{
              backgroundColor: COLORS.primary,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              marginLeft: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.card, fontWeight: "bold" }}>+</Text>
          </Pressable>
        </View>

        {habit.miniSteps?.length ? (
          <>
            {habit.miniSteps.map((step, index) => {
              const doneToday = !!step.doneByDate?.[todayKey];
              const motivationText = motivationTexts[step.id];
              return (
                <View key={step.id} style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 18, color: COLORS.text }}>
                    {index + 1}. {step.title}
                  </Text>
                  <Text style={{ color: doneToday ? "green" : COLORS.muted }}>
                    {doneToday ? `Erledigt! ${motivationText || "Weiter so!"}` : "Noch nicht erledigt"}
                  </Text>
                  <Pressable
                    onPress={() => toggleMiniStep(step.id)}
                    style={{
                      backgroundColor: COLORS.primary,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ color: COLORS.card, fontWeight: "bold" }}>
                      {doneToday ? "Rückgängig" : "Als erledigt markieren"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={{ marginTop: 6, color: COLORS.muted }}>
            Kein Mini-Step definiert.
          </Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Ziel ergänzen</Text>
        <TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="Mein Ziel" style={styles.input} />
        <TextInput value={goalReward} onChangeText={setGoalReward} placeholder="Meine Belohnung" style={styles.input} />
        <TextInput
          value={goalTarget}
          onChangeText={(text) => setGoalTarget(text.replace(/[^0-9]/g, ""))}
          placeholder="Anzahl der zu sammelnden Sterne"
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <View
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Pressable
          onPress={saveDetails}
          disabled={isSavingDetails}
          style={{
            backgroundColor: isSavingDetails ? "#B8A8E0" : COLORS.primary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: "center",
            opacity: isSavingDetails ? 0.6 : 1,
          }}
        >
          <Text style={{ color: COLORS.card, fontSize: 16, fontWeight: "bold" }}>
            {isSavingDetails ? "✓ Gespeichert" : "Änderungen speichern"}
          </Text>
        </Pressable>

        <Pressable 
          onPress={() => deleteHabit()}
          style={({ pressed }) => ({
            alignItems: "center",
            borderColor: "#D32F2F",
            borderRadius: 12,
            borderWidth: 2,
            marginTop: 16,
            paddingVertical: 12,
            backgroundColor: pressed ? "#FFE0E0" : "transparent",
          })}
        >
          <Text style={{ color: "#D32F2F", fontWeight: "700", fontSize: 16 }}>Habit löschen</Text>
        </Pressable>
      </View>
    </ScrollView>
    <GoalCompleteModal
      goal={goalPopup}
      visible={Boolean(goalPopup)}
      onClose={() => setGoalPopup(null)}
    />
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
  editCard: { backgroundColor: "#FFFFFF", borderColor: "#C9C4FF", borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 14 },
  sectionTitle: { color: "#3A236D", fontSize: 16, fontWeight: "700", marginBottom: 8, marginTop: 4 },
  overviewLabel: { color: "#8B5CF6", fontSize: 12, fontWeight: "700", marginTop: 10 },
  overviewValue: { color: "#1B1B1B", fontSize: 15, marginTop: 2 },
  starsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  star: { color: "#E7DDBA", fontSize: 21, marginRight: 3 },
  starEarned: { color: "#F5B91E" },
  progressTrack: { backgroundColor: "#E9E0FF", borderRadius: 8, height: 10, marginTop: 10, overflow: "hidden" },
  progressFill: { backgroundColor: "#6631D7", borderRadius: 8, height: "100%" },
  progressText: { color: "#666666", fontSize: 12, marginTop: 6 },
  completeText: { color: "#D18A00", fontWeight: "800", marginTop: 8 },
  input: { backgroundColor: "#FFFFFF", borderColor: "#C9C4FF", borderRadius: 9, borderWidth: 1, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10 },
  deleteButton: { alignItems: "center", borderColor: "#D32F2F", borderRadius: 9, borderWidth: 1, marginTop: 10, paddingVertical: 11 },
  deleteText: { color: "#D32F2F", fontWeight: "700" },
  // TimeStepper Styles
  timeStepperRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", marginTop: 12, marginBottom: 12 },
  timePart: { alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 8, marginRight: 8, padding: 8 },
  timePartDisabled: { opacity: 0.4 },
  arrowButton: { padding: 6 },
  arrow: { color: "#6631D7", fontSize: 16, fontWeight: "bold" },
  timeValue: { fontSize: 20, fontWeight: "bold", marginVertical: 6, minWidth: 40, textAlign: "center" },
  timeSeparator: { fontSize: 20, fontWeight: "bold", marginRight: 8, marginLeft: 0 },
  reminderOptions: { flexDirection: "column", marginLeft: 16, gap: 8 },
  radioOption: { alignItems: "center", flexDirection: "row" },
  radio: { alignItems: "center", borderColor: "#8B5CF6", borderRadius: 10, borderWidth: 2, height: 20, justifyContent: "center", marginRight: 7, width: 20 },
  radioSelected: { backgroundColor: "#FFFFFF" },
  radioDot: { backgroundColor: "#6631D7", borderRadius: 5, height: 10, width: 10 },
  radioLabel: { color: "#3A236D", fontSize: 12, fontWeight: "600" },
};
