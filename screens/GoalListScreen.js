import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import HeaderLogo from "../components/HeaderLogo";
import { loadHabits } from "../storage/habitStorage";

const COLORS = { primary: "#7C3AED", dark: "#3A236D", muted: "#6B5A91" };

function starsFor(habit) {
  return Object.values(habit.habitDoneByDate || {}).filter(Boolean).length;
}

export default function GoalListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const focused = useIsFocused();
  const [habits, setHabits] = useState([]);
  const reached = route.params?.filter === "reached";

  useEffect(() => {
    if (focused) loadHabits().then(setHabits);
  }, [focused]);

  const goals = habits
    .filter((habit) => habit.goal?.title)
    .filter((habit) => {
      const target = Number(habit.goal.target) || 10;
      return reached ? starsFor(habit) >= target : starsFor(habit) < target;
    });

  return (
    <ImageBackground source={require("../assets/purple-watercolour-background-corners.avif")} resizeMode="cover" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.page}>
        <HeaderLogo compact />
        <Text style={styles.title}>{reached ? "Erreichte Ziele" : "Offene Ziele"}</Text>
        <Text style={styles.subtitle}>{reached ? "Diese Belohnungen hast du dir verdient." : "Sammle weitere Sterne durch deine Habits."}</Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Zurück</Text>
        </Pressable>
        {goals.length ? goals.map((habit) => {
          const stars = starsFor(habit);
          const target = Number(habit.goal.target) || 10;
          return (
            <View key={habit.id} style={styles.card}>
              <Text style={styles.goalTitle}>{habit.goal.title}</Text>
              <Text style={styles.linked}>Habit: {habit.title}</Text>
              <Text style={styles.reward}>Belohnung: {habit.goal.reward || "Keine Belohnung festgelegt"}</Text>
              <View style={styles.stars}>
                {Array.from({ length: target }, (_, index) => <Text key={index} style={[styles.star, index < stars && styles.earned]}>★</Text>)}
              </View>
              <Text style={styles.progress}>{stars} / {target} Sterne</Text>
            </View>
          );
        }) : (
          <View style={styles.empty}><Text style={styles.emptyText}>{reached ? "Noch kein Ziel erreicht." : "Keine offenen Ziele vorhanden."}</Text></View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = {
  page: { flexGrow: 1, padding: 16, paddingBottom: 30 },
  title: { color: COLORS.dark, fontSize: 24, fontWeight: "800" },
  subtitle: { color: COLORS.muted, marginBottom: 16, marginTop: 6 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 15, marginBottom: 12, padding: 16 },
  goalTitle: { color: COLORS.dark, fontSize: 18, fontWeight: "800" },
  linked: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  reward: { color: "#8069A8", marginTop: 12 },
  stars: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  star: { color: "#E7DDBA", fontSize: 21, marginRight: 3 },
  earned: { color: "#F5B91E" },
  progress: { color: COLORS.muted, fontSize: 12, marginTop: 7 },
  empty: { backgroundColor: "#FFFFFF", borderRadius: 15, marginTop: 10, padding: 20 },
  emptyText: { color: COLORS.muted, textAlign: "center" },
  backButton: { alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 10, marginTop: 14, padding: 14 },
  backText: { color: "#FFFFFF", fontWeight: "800" },
};
