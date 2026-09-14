import { Alert, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import HeaderLogo from "../components/HeaderLogo";
import { loadHabits } from "../storage/habitStorage";

const COLORS = { primary: "#7C3AED", dark: "#3A236D", muted: "#6B5A91" };

function completedStars(habit) {
  return Object.values(habit.habitDoneByDate || {}).filter(Boolean).length;
}

export default function GoalsScreen() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    if (focused) loadHabits().then(setHabits);
  }, [focused]);

  const goalHabits = habits.filter((habit) => habit.goal?.title);

  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <HeaderLogo compact />
        <Text style={styles.title}>Meine Ziele</Text>
        <Pressable style={styles.newGoalButton} onPress={() => navigation.navigate("AddHabit")}>
          <Text style={styles.newGoalText}>＋ NEUES ZIEL ÜBER HABIT SETZEN</Text>
        </Pressable>
        <View style={styles.listButtons}>
          <Pressable style={styles.listButton} onPress={() => navigation.navigate("GoalList", { filter: "open" })}>
            <Text style={styles.listButtonText}>Offene Ziele</Text>
          </Pressable>
          <Pressable style={styles.listButton} onPress={() => navigation.navigate("GoalList", { filter: "reached" })}>
            <Text style={styles.listButtonText}>Erreichte Ziele</Text>
          </Pressable>
        </View>

        {!goalHabits.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Noch kein Ziel gesetzt!</Text>
            <Text style={styles.emptyText}>Erstelle ein Habit und verknüpfe es direkt mit einem Ziel.</Text>
          </View>
        ) : (
          goalHabits.map((habit) => {
            const stars = completedStars(habit);
            const target = habit.goal.target || 10;
            const progress = Math.min(stars / target, 1);
            return (
              <View key={habit.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle}>{habit.goal.title}</Text>
                    <Text style={styles.habitName}>Verknüpft mit: {habit.title}</Text>
                  </View>
                  <Text style={styles.target}>🎯</Text>
                </View>
                <Text style={styles.reward}>Belohnung: {habit.goal.reward || "Noch keine Belohnung festgelegt"}</Text>
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
              </View>
            );
          })
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = {
  page: { flexGrow: 1, padding: 16, paddingBottom: 30 },
  title: { color: COLORS.dark, fontSize: 23, fontWeight: "800", marginBottom: 14 },
  newGoalButton: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 11, paddingVertical: 15 },
  newGoalText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  listButtons: { flexDirection: "row", gap: 8, marginTop: 10 },
  listButton: { alignItems: "center", backgroundColor: "#F0EBFF", borderColor: "#C9C4FF", borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 12 },
  listButtonText: { color: COLORS.primary, fontWeight: "700" },
  emptyCard: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 15, marginTop: 12, padding: 24 },
  emptyIcon: { fontSize: 38, marginBottom: 10 },
  emptyTitle: { color: COLORS.primary, fontSize: 16, fontWeight: "800" },
  emptyText: { color: COLORS.muted, marginTop: 8, textAlign: "center" },
  goalCard: { backgroundColor: "#FFFFFF", borderRadius: 15, marginTop: 12, padding: 16 },
  goalHeader: { alignItems: "center", flexDirection: "row" },
  goalTitle: { color: COLORS.dark, fontSize: 17, fontWeight: "800" },
  habitName: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  target: { fontSize: 26, marginLeft: 10 },
  reward: { color: "#8069A8", fontSize: 13, marginTop: 14 },
  starsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  star: { color: "#E7DDBA", fontSize: 21, marginRight: 3 },
  starEarned: { color: "#F5B91E" },
  progressTrack: { backgroundColor: "#E9E0FF", borderRadius: 8, height: 10, marginTop: 14, overflow: "hidden" },
  progressFill: { backgroundColor: COLORS.primary, borderRadius: 8, height: "100%" },
  progressText: { color: COLORS.muted, fontSize: 12, marginTop: 7 },
  completeText: { color: "#D18A00", fontWeight: "800", marginTop: 10 },
};
