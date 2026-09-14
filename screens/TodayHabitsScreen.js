import { ImageBackground, View, Text, FlatList, Pressable, TouchableOpacity, Button } from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
// Repository functions for loading and saving habits
import { loadHabits, saveHabits } from "../storage/habitStorage";
import { getDateKey } from "../helper/date";
import { getMotivationText } from "../helper/motivationText";
import HeaderLogo from "../components/HeaderLogo";
import GoalCompleteModal from "../components/GoalCompleteModal";

const COLORS = {
  background: "#DEDAFF",
  primary: "#6631D7",
  card: "#FFFFFF",
  border: "#C9C4FF",
};

// Prüft, ob eine Habit heute geplant ist
function isPlannedForToday(habit, date = new Date()) {
  // Daily habits are always active
  if (habit.frequency === "daily") return true;
  // Weekly habits are shown only on selected weekdays
  if (habit.frequency === "weekly") {
    const today = date.getDay(); // 0..6
    const days = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : [];
    if (days.length === 0) return true;
    return days.includes(today);
  }

  return true;
}

// Status + positives Feedback
function getStatusText(habit, todayKey, motivationText) {
  const habitDone = !!habit.habitDoneByDate?.[todayKey];
  const miniDone = !!habit.miniStepDoneByDate?.[todayKey];

  if (habitDone) {
    return `🎉 ${motivationText || "Geschafft! Weiter so!"}`;
  }
  if (miniDone) {
    return "✔️ Mini-step erledigt – super Fortschritt!";
  }
  return "⚪ Noch nicht erledigt";
}

export default function TodayHabitsScreen() {
  const navigation = useNavigation();
  const [habits, setHabits] = useState([]);
  const [goalPopup, setGoalPopup] = useState(null);
  const [motivationTexts, setMotivationTexts] = useState({});

  const todayKey = getDateKey();

  async function refresh() {
    const data = await loadHabits();
    setHabits(data);
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation]);

  // Habit für heute erledigt / wieder öffnen
  async function toggleHabitDoneToday(habitId) {
    const currentHabit = habits.find((habit) => habit.id === habitId);
    const wasDone = Boolean(currentHabit?.habitDoneByDate?.[todayKey]);
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;

      const current = !!h.habitDoneByDate?.[todayKey];
      return {
        ...h,
        habitDoneByDate: {
          ...(h.habitDoneByDate || {}),
          [todayKey]: !current,
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
      const oldStars = Object.values(currentHabit.habitDoneByDate || {}).filter(Boolean).length;
      const newStars = oldStars + 1;
      const target = currentHabit.goal.target || 10;
      const previousGoalsReached = Math.floor(oldStars / target);
      const currentGoalsReached = Math.floor(newStars / target);
      if (currentGoalsReached > previousGoalsReached) {
        setGoalPopup({
          goalTitle: currentHabit.goal.title,
          reward: currentHabit.goal.reward,
        });
      }
    }
  }

  // Einzelnen Mini-Step für heute abhaken / zurücksetzen
  async function toggleMiniStep(habitId, stepId) {
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

  const todayHabits = habits.filter((h) => isPlannedForToday(h));

  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 16,
        backgroundColor: "transparent",
        flex: 1,
      }}
    >
      <HeaderLogo compact />

      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Heutige Habits
      </Text>

      <FlatList
        style={{ marginTop: 16 }}
        data={todayHabits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          >
            {/* Detail-Navigation */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("HabitDetail", { habitId: item.id })
              }
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                {item.title}
              </Text>
              <Text style={{ marginTop: 6 }}>
                {getStatusText(item, todayKey, motivationTexts[`habit-${item.id}`])}
              </Text>
            </TouchableOpacity>

            {/* Als erledigt markieren */}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(item.habitDoneByDate?.[todayKey]) }}
              onPress={() => toggleHabitDoneToday(item.id)}
              style={{ alignItems: "center", flexDirection: "row", marginTop: 12 }}
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
                  backgroundColor: item.habitDoneByDate?.[todayKey] ? COLORS.primary : "transparent",
                }}
              >
                {item.habitDoneByDate?.[todayKey] && (
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "900" }}>✓</Text>
                )}
              </View>
              <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                {item.habitDoneByDate?.[todayKey] ? "Heute erledigt" : "Als erledigt markieren"}
              </Text>
            </Pressable>

            {item.reminderTime ? (
              <Text style={{ marginTop: 4 }}>
                ⏰ {item.reminderTime}
              </Text>
            ) : null}

            {/* Mini-Steps */}
            {item.miniSteps?.length ? (
              <View style={{ marginTop: 10 }}>
                {item.miniSteps.map((step) => {
                  const stepDone = Boolean(step.doneByDate?.[todayKey]);
                  return (
                    <Pressable
                      key={step.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: stepDone }}
                      onPress={() => toggleMiniStep(item.id, step.id)}
                      style={{ alignItems: "center", flexDirection: "row", marginTop: 8 }}
                    >
                      <View
                        style={{
                          alignItems: "center",
                          borderColor: COLORS.primary,
                          borderRadius: 10,
                          borderWidth: 2,
                          height: 20,
                          justifyContent: "center",
                          marginRight: 8,
                          width: 20,
                        }}
                      >
                        {stepDone && (
                          <View
                            style={{
                              backgroundColor: COLORS.primary,
                              borderRadius: 5,
                              height: 10,
                              width: 10,
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          color: stepDone ? "green" : "#333",
                          textDecorationLine: stepDone ? "line-through" : "none",
                        }}
                      >
                        {step.title}
                      </Text>
                      {stepDone && (
                        <Text style={{ color: "green", marginLeft: 8, flexShrink: 1 }}>
                          {motivationTexts[step.id] || "Erledigt! Weiter so!"}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}
      />

      <Pressable
        onPress={() => navigation.navigate("AddHabit")}
        style={{
          backgroundColor: COLORS.primary,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <Text style={{ color: COLORS.card, fontSize: 16, fontWeight: "bold" }}>
          + Neuen Habit hinzufügen
        </Text>
      </Pressable>
      <GoalCompleteModal
        goal={goalPopup && { title: goalPopup.goalTitle, reward: goalPopup.reward }}
        visible={Boolean(goalPopup)}
        onClose={() => setGoalPopup(null)}
      />
    </View>
    </ImageBackground>
  );
}
