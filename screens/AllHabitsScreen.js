import { Button, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import HeaderLogo from "../components/HeaderLogo";
import { getDateKey } from "../helper/date";
import { getMotivationText } from "../helper/motivationText";
import { loadHabits, saveHabits } from "../storage/habitStorage";
import GoalCompleteModal from "../components/GoalCompleteModal";

const COLORS = { background: "#DEDAFF", primary: "#6631D7" };
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function dateKey(year, month, day) {
  return getDateKey(new Date(year, month, day));
}

function isPlanned(habit, date) {
  if (habit.frequency !== "weekly") return true;
  const days = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : [];
  return !days.length || days.includes(date.getDay());
}

export default function AllHabitsScreen() {
  const navigation = useNavigation();
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goalPopup, setGoalPopup] = useState(null);
  const [motivationTexts, setMotivationTexts] = useState({});

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadHabits().then(setHabits);
    });
    loadHabits().then(setHabits);
    return unsubscribe;
  }, [navigation]);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedKey = dateKey(year, month, selectedDate.getDate());
  const selectedHabits = habits.filter((habit) =>
    isPlanned(habit, selectedDate)
  );

  function shiftMonth(offset) {
    setSelectedDate(new Date(year, month + offset, 1));
  }

  async function toggleHabitForSelectedDate(habitId) {
    const currentHabit = habits.find((habit) => habit.id === habitId);
    const wasDone = Boolean(currentHabit?.habitDoneByDate?.[selectedKey]);
    const updated = habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      return {
        ...habit,
        habitDoneByDate: {
          ...(habit.habitDoneByDate || {}),
          [selectedKey]: !habit.habitDoneByDate?.[selectedKey],
        },
      };
    });
    setHabits(updated);
    await saveHabits(updated);

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

  // Einzelnen Mini-Step für das gewählte Datum abhaken / zurücksetzen
  async function toggleMiniStepForSelectedDate(habitId, stepId) {
    const currentHabit = habits.find((h) => h.id === habitId);
    const currentStep = currentHabit?.miniSteps?.find((s) => s.id === stepId);
    const wasNotDone = !currentStep?.doneByDate?.[selectedKey];
    const wasHabitDoneBefore = Boolean(currentHabit?.habitDoneByDate?.[selectedKey]);

    let autoCompleted = false;
    const updated = habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      const miniSteps = (habit.miniSteps || []).map((step) =>
        step.id === stepId
          ? {
              ...step,
              doneByDate: {
                ...(step.doneByDate || {}),
                [selectedKey]: !step.doneByDate?.[selectedKey],
              },
            }
          : step
      );
      // Habit automatisch als erledigt markieren, wenn alle Mini-Steps fertig sind
      const allMiniStepsDone = miniSteps.length > 0 && miniSteps.every((step) => step.doneByDate?.[selectedKey]);
      const habitDoneByDate = { ...(habit.habitDoneByDate || {}) };
      if (allMiniStepsDone && !habitDoneByDate[selectedKey]) {
        habitDoneByDate[selectedKey] = true;
        autoCompleted = true;
      }
      return { ...habit, miniSteps, habitDoneByDate };
    });
    setHabits(updated);
    await saveHabits(updated);

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

  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
    <ScrollView contentContainerStyle={styles.page}>
      <HeaderLogo compact />
      <Text style={styles.title}>Alle Habits</Text>
      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.arrowButton}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.arrowButton}>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: mondayOffset }).map((_, index) => <View key={`empty-${index}`} style={styles.dayCell} />)}
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
            const key = dateKey(year, month, day);
            const date = new Date(year, month, day);
            const selected = key === selectedKey;
            const hasCompleted = habits.some((habit) => habit.habitDoneByDate?.[key]);
            return (
              <Pressable key={day} onPress={() => setSelectedDate(date)} style={[styles.dayCell, selected && styles.selectedDay]}>
                <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day}</Text>
                {hasCompleted && <View style={styles.dayDot} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.selectedTitle}>
        {selectedDate.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
      </Text>
      {selectedHabits.length ? selectedHabits.map((habit) => {
        const done = Boolean(habit.habitDoneByDate?.[selectedKey]);
        return (
          <View key={habit.id} style={styles.habitCard}>
            <View style={{ flex: 1 }}>
              <Pressable onPress={() => navigation.navigate("HabitDetail", { habitId: habit.id })}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
              </Pressable>
              <Text style={styles.habitMeta}>
                {done ? `🎉 ${motivationTexts[`habit-${habit.id}`] || "Geschafft! Weiter so!"}` : "Noch offen"}
              </Text>

              {habit.miniSteps?.length ? (
                <View style={{ marginTop: 8 }}>
                  {habit.miniSteps.map((step) => {
                    const stepDone = Boolean(step.doneByDate?.[selectedKey]);
                    return (
                      <Pressable
                        key={step.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: stepDone }}
                        onPress={() => toggleMiniStepForSelectedDate(habit.id, step.id)}
                        style={{ alignItems: "center", flexDirection: "row", marginTop: 6 }}
                      >
                        <View style={[styles.miniStepRadio, stepDone && styles.miniStepRadioSelected]}>
                          {stepDone && <View style={styles.miniStepDot} />}
                        </View>
                        <Text style={[styles.miniStepText, stepDone && styles.miniStepTextDone]}>
                          {step.title}
                        </Text>
                        {stepDone && (
                          <Text style={styles.miniStepMotivation}>
                            {motivationTexts[step.id] || "Erledigt! Weiter so!"}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => toggleHabitForSelectedDate(habit.id)}
              style={[styles.checkbox, done && styles.checkboxChecked]}
            >
              {done && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          </View>
        );
      }) : <Text style={styles.empty}>Für diesen Tag sind keine Habits geplant.</Text>}
      <Button title="＋ Habit hinzufügen" onPress={() => navigation.navigate("AddHabit")} color={COLORS.primary} />
      <GoalCompleteModal
        goal={goalPopup}
        visible={Boolean(goalPopup)}
        onClose={() => setGoalPopup(null)}
      />
    </ScrollView>
    </ImageBackground>
  );
}

const styles = {
  page: { backgroundColor: "transparent", flexGrow: 1, padding: 16, paddingBottom: 30 },
  title: { color: "#3A236D", fontSize: 23, fontWeight: "800", marginBottom: 14 },
  calendarCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14 },
  monthHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  monthTitle: { color: "#3A236D", fontSize: 18, fontWeight: "800" },
  arrowButton: { padding: 8 },
  arrow: { color: COLORS.primary, fontSize: 28, lineHeight: 28 },
  weekRow: { flexDirection: "row", marginTop: 14 },
  weekday: { color: "#8B5CF6", flex: 1, fontSize: 12, fontWeight: "700", textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  dayCell: { alignItems: "center", height: 44, justifyContent: "center", width: "14.2857%" },
  selectedDay: { backgroundColor: COLORS.primary, borderRadius: 10 },
  dayText: { color: "#3A236D", fontWeight: "600" },
  selectedDayText: { color: "#FFFFFF" },
  dayDot: { backgroundColor: "#F59E0B", borderRadius: 3, height: 5, marginTop: 3, width: 5 },
  selectedTitle: { color: "#3A236D", fontSize: 17, fontWeight: "800", marginBottom: 10, marginTop: 20 },
  habitCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#C9C4FF", borderRadius: 12, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 14 },
  habitTitle: { color: "#2B1857", fontSize: 16, fontWeight: "800" },
  habitMeta: { color: "#7D6BA5", marginTop: 4 },
  radio: { alignItems: "center", borderColor: "#8B5CF6", borderRadius: 12, borderWidth: 2, height: 24, justifyContent: "center", marginLeft: 12, width: 24 },
  radioSelected: { backgroundColor: "#FFFFFF" },
  radioDot: { backgroundColor: COLORS.primary, borderRadius: 6, height: 12, width: 12 },
  checkbox: { alignItems: "center", borderColor: "#8B5CF6", borderRadius: 6, borderWidth: 2, height: 26, justifyContent: "center", marginLeft: 12, width: 26, backgroundColor: "transparent" },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkmark: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  miniStepRadio: { alignItems: "center", borderColor: "#8B5CF6", borderRadius: 10, borderWidth: 2, height: 20, justifyContent: "center", marginRight: 8, width: 20 },
  miniStepRadioSelected: { backgroundColor: "#FFFFFF" },
  miniStepDot: { backgroundColor: COLORS.primary, borderRadius: 5, height: 10, width: 10 },
  miniStepText: { color: "#2B1857", fontSize: 13 },
  miniStepTextDone: { color: "green", textDecorationLine: "line-through" },
  miniStepMotivation: { color: "green", fontSize: 12, marginLeft: 8, flexShrink: 1 },
  empty: { color: "#5E4B85", marginBottom: 14 },
};