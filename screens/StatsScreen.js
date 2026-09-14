// Import basic UI components and styling utilities
import { ImageBackground, View, Text, StyleSheet, Pressable } from "react-native";
// React hooks for state management and lifecycle handling
import { useEffect, useState } from "react";
// Repository function to load habits from local storage
import { loadHabits } from "../storage/habitStorage";
// Reusable header component with the app logo
import HeaderLogo from "../components/HeaderLogo";
import { useNavigation } from "@react-navigation/native";
// Helper to generate a standardized date key (YYYY-MM-DD)
import { getDateKey } from "../helper/date";

function isPlannedForToday(habit, date = new Date()) {
  if (habit.frequency !== "weekly") return true;
  const days = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : [];
  return !days.length || days.includes(date.getDay());
}

function countCompletedDates(doneByDate) {
  return Object.values(doneByDate || {}).filter(Boolean).length;
}

function countCompletedMiniSteps(habit) {
  if (Array.isArray(habit.miniSteps)) {
    return habit.miniSteps.reduce(
      (total, step) => total + countCompletedDates(step.doneByDate),
      0
    );
  }
  return countCompletedDates(habit.miniStepDoneByDate);
}

//Shows how many habits and mini-steps were completed today, and provides an overall habit count.
export default function StatsScreen({ route }) {
  const navigation = useNavigation();
  const isGeneral = route.params?.mode === "general";
  // State holding all habits loaded from storage
  const [habits, setHabits] = useState([]);
  // Date key for today, used to access per-day completion data
  const todayKey = getDateKey();
//Load habits once when the screen is mounted.Data is fetched from AsyncStorage via the repository.
  useEffect(() => {
    loadHabits().then(setHabits);
  }, []);

  // ====== STATS CALCULATIONS ======
  const todayHabits = habits.filter((habit) => isPlannedForToday(habit));
  const completedToday = todayHabits.filter(
    (habit) => habit.habitDoneByDate?.[todayKey]
  ).length;
  const progressPercent = todayHabits.length
    ? Math.round((completedToday / todayHabits.length) * 100)
    : 0;
  const completedHabitsTotal = habits.reduce(
    (total, habit) => total + countCompletedDates(habit.habitDoneByDate),
    0
  );
  const miniStepsDoneTotal = habits.reduce(
    (total, habit) => total + countCompletedMiniSteps(habit),
    0
  );
  const collectedGoalStars = habits.reduce(
    (total, habit) =>
      total + (habit.goal?.title ? countCompletedDates(habit.habitDoneByDate) : 0),
    0
  );

  const collectedGoalStarsToday = todayHabits.filter(
    (habit) => habit.goal?.title && habit.habitDoneByDate?.[todayKey]
  ).length;
  const achievedGoalsTotal = habits.reduce((total, habit) => {
    if (!habit.goal?.title) return total;
    const target = Number(habit.goal.target) || 10;
    return total + Math.floor(countCompletedDates(habit.habitDoneByDate) / target);
  }, 0);

  return (
 <ImageBackground
   source={require("../assets/purple-watercolour-background-corners.avif")}
   resizeMode="cover"
   style={{ flex: 1 }}
    >
 <View style={styles.container}>
   <HeaderLogo compact />

      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleOption, !isGeneral && styles.toggleActive]}
          onPress={() => navigation.setParams({ mode: "today" })}
        >
          <Text style={!isGeneral ? styles.toggleActiveText : styles.toggleText}>Heute</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleOption, isGeneral && styles.toggleActive]}
          onPress={() => navigation.setParams({ mode: "general" })}
        >
          <Text style={isGeneral ? styles.toggleActiveText : styles.toggleText}>Allgemein</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{isGeneral ? "Dein gesamter Fortschritt" : "Das hast du heute bereits erreicht ✨"}</Text>

      {/* GRID */}
      <View style={styles.grid}>
        {isGeneral ? (
          <>
            <StatCard icon="🏆" value={completedHabitsTotal} label="Habits insgesamt erledigt" />
            <StatCard icon="✔️" value={miniStepsDoneTotal} label="Mini-Steps insgesamt erledigt" />
            <StatCard icon="⭐" value={collectedGoalStars} label="Sterne insgesamt gesammelt" />
            <StatCard icon="🎯" value={achievedGoalsTotal} label="Ziele erreicht" />
          </>
        ) : (
          <>
        <StatCard icon="🏆" value={completedToday} label="Habits erledigt" onPress={() => navigation.navigate("StatsHabitsList", { filter: "completed" })} />
        <StatCard
          icon="✔️"
          value={habits.reduce((total, habit) => total + (habit.miniSteps || []).filter((step) => step.doneByDate?.[todayKey]).length, 0)}
          label="Mini-Steps erledigt"
          onPress={() => navigation.navigate("StatsHabitsList", { filter: "miniSteps" })}
        />
        <StatCard
          icon="📅"
          value={todayHabits.length}
          label="Heutige Habits"
          onPress={() => navigation.navigate("StatsHabitsList", { filter: "open" })}
        />
        <StatCard
          icon="⭐"
          value={collectedGoalStarsToday}
          label="Gesammelte Sterne"
          onPress={() => navigation.navigate("GoalList", { filter: "reached" })}
        />
          </>
        )}
      </View>

      {!isGeneral && <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>FORTSCHRITT HEUTE</Text>
        <Text style={styles.progressValue}>{progressPercent}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressMeta}>
          {completedToday} von {todayHabits.length} heutigen Habits erledigt
        </Text>
      </View>}

      {isGeneral && (
        <Text style={styles.praise}>
          Jeder Schritt zählt. Du kannst stolz auf das sein, was du bereits geschafft hast! ✨
        </Text>
      )}
    </View>
    </ImageBackground>
  );
}

/* ================= COMPONENT ================= */

function StatCard({ icon, value, label, onPress }) {
  const Card = onPress ? Pressable : View;
  return (
    <Card style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 16,
    textAlign: "center",
    color: "#1B1B1B",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#7C3AED",
    borderColor: "#A78BFA",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 22,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 3,
  },
  icon: {
    fontSize: 28,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    color: "#F3EFFF",
    textAlign: "center",
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 4,
    padding: 16,
  },
  progressLabel: { color: "#7C3AED", fontSize: 12, fontWeight: "800" },
  progressValue: { color: "#2B1857", fontSize: 28, fontWeight: "800", marginTop: 5 },
  progressTrack: { backgroundColor: "#E8E0FF", borderRadius: 8, height: 14, marginTop: 10, overflow: "hidden" },
  progressFill: { backgroundColor: "#7C3AED", borderRadius: 8, height: "100%" },
  progressMeta: { color: "#9A89BF", fontSize: 12, marginTop: 7 },
  toggle: { backgroundColor: "#E8E0FF", borderRadius: 11, flexDirection: "row", marginBottom: 16, padding: 4 },
  toggleOption: { alignItems: "center", borderRadius: 8, flex: 1, paddingVertical: 10 },
  toggleActive: { backgroundColor: "#7C3AED" },
  toggleText: { color: "#7C3AED", fontWeight: "700" },
  toggleActiveText: { color: "#FFFFFF", fontWeight: "800" },
  praise: { color: "#3A236D", fontSize: 16, fontWeight: "700", lineHeight: 24, marginTop: 18, textAlign: "center" },
});
