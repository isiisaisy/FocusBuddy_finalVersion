import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import HeaderLogo from "../components/HeaderLogo";
import { getDateKey } from "../helper/date";
import { loadHabits } from "../storage/habitStorage";

const COLORS = { primary: "#7C3AED", dark: "#3A236D", muted: "#6B5A91" };

function isPlannedToday(habit) {
  if (habit.frequency !== "weekly") return true;
  const days = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : [];
  return !days.length || days.includes(new Date().getDay());
}

export default function StatsHabitsListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const focused = useIsFocused();
  const [habits, setHabits] = useState([]);
  const todayKey = getDateKey();
  const showCompleted = route.params?.filter === "completed";
  const showMiniSteps = route.params?.filter === "miniSteps";

  useEffect(() => {
    if (focused) loadHabits().then(setHabits);
  }, [focused]);

  const todayHabits = habits.filter(isPlannedToday);
  const filteredHabits = todayHabits.filter((habit) =>
    showCompleted
      ? Boolean(habit.habitDoneByDate?.[todayKey])
      : !habit.habitDoneByDate?.[todayKey]
  );
  const completedMiniSteps = todayHabits.flatMap((habit) =>
    (habit.miniSteps || [])
      .filter((step) => step.doneByDate?.[todayKey])
      .map((step) => ({ habit, step }))
  );

  return (
    <ImageBackground source={require("../assets/purple-watercolour-background-corners.avif")} resizeMode="cover" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.page}>
        <HeaderLogo compact />
        <Text style={styles.title}>
          {showMiniSteps ? "Heute erledigte Mini-Steps" : showCompleted ? "Heute erledigt" : "Heute noch offen"}
        </Text>
        <Text style={styles.subtitle}>
          {showMiniSteps
            ? "Diese Mini-Steps hast du heute schon abgehakt."
            : showCompleted
            ? "Das hast du heute schon geschafft."
            : "Diese Habits warten heute noch auf dich."}
        </Text>
        <Pressable style={styles.backButton} onPress={() => navigation.navigate("Stats")}>
          <Text style={styles.backText}>Zurück zu Stats</Text>
        </Pressable>
        {showMiniSteps ? (
          completedMiniSteps.length ? completedMiniSteps.map(({ habit, step }) => (
            <Pressable key={step.id} style={styles.card} onPress={() => navigation.navigate("HabitDetail", { habitId: habit.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.habitTitle}>{step.title}</Text>
                <Text style={styles.meta}>Habit: {habit.title}</Text>
              </View>
              <Text style={[styles.status, styles.done]}>✓</Text>
            </Pressable>
          )) : (
            <View style={styles.emptyCard}>
              <Text style={styles.empty}>Heute wurde noch kein Mini-Step erledigt.</Text>
            </View>
          )
        ) : filteredHabits.length ? filteredHabits.map((habit) => (
          <Pressable key={habit.id} style={styles.card} onPress={() => navigation.navigate("HabitDetail", { habitId: habit.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.habitTitle}>{habit.title}</Text>
              <Text style={styles.meta}>{showCompleted ? "Erledigt" : "Noch offen"}</Text>
            </View>
            <Text style={[styles.status, showCompleted && styles.done]}>{showCompleted ? "✓" : "○"}</Text>
          </Pressable>
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>{showCompleted ? "Heute wurde noch kein Habit erledigt." : "Alle heutigen Habits sind erledigt."}</Text>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = {
  page: { backgroundColor: "transparent", flexGrow: 1, padding: 16, paddingBottom: 30 },
  title: { color: COLORS.dark, fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: COLORS.muted, marginBottom: 18 },
  card: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#C9C4FF", borderRadius: 13, borderWidth: 1, flexDirection: "row", marginBottom: 10, padding: 16 },
  habitTitle: { color: COLORS.dark, fontSize: 17, fontWeight: "800" },
  meta: { color: COLORS.muted, marginTop: 5 },
  status: { color: "#A99AC7", fontSize: 30, marginLeft: 12 },
  done: { color: "#22A06B" },
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 13, padding: 18 },
  empty: { color: COLORS.muted, textAlign: "center" },
  backButton: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 10, marginBottom: 14, padding: 14 },
  backText: { color: "#FFFFFF", fontWeight: "800" },
};
