import {
  View,
  Text,
  Button,
  ScrollView,
  Pressable,
  ImageBackground,
} from "react-native";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import HeaderLogo from "../components/HeaderLogo";
import MotivationCard from "../components/MotivationCard";
// Data model factory
// Repository functions (Repository Pattern)
import { getMotivation } from "../helper/motivation";


const COLORS = {
  background: "#DEDAFF",
  primary: "#6631D7",
};

const MOTIVATION_IMAGES = [
  require("../assets/beautifulthings.jpg"),
  require("../assets/believe.jpg"),
  require("../assets/enjoy.jpg"),
  require("../assets/happymind.jpg"),
  require("../assets/humanthings.jpg"),
  require("../assets/impossible.jpg"),
  require("../assets/keepgoing.jpg"),
  require("../assets/littlethings.jpg"),
  require("../assets/love.jpg"),
  require("../assets/kaffee.jpg"),
  require("../assets/never_give_up.jpg"),
  require("../assets/perfect.png"),
  require("../assets/positive.jpg"),
  require("../assets/priority.jpg"),
  require("../assets/selfbelieve.jpg"),
  require("../assets/whereyouare.jpg"),
];

export default function HomeScreen() {
  const navigation = useNavigation();
  // Motivation state
  const [motivation, setMotivation] = useState(null);
  const [motivationImage, setMotivationImage] = useState(null);
  const [loadingMotivation, setLoadingMotivation] = useState(false);
//Loads a motivational text from an external API.
  async function loadMotivation() {
    setLoadingMotivation(true);
    const text = await getMotivation();
    setMotivation(text);
    setMotivationImage(
      MOTIVATION_IMAGES[Math.floor(Math.random() * MOTIVATION_IMAGES.length)]
    );
    setLoadingMotivation(false);
  }

  // ================= DELETE HABIT =================
  // ================= UI =================
  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.page}
      >
      <HeaderLogo compact />

      <Text style={styles.welcome}>Willkommen, schön dass du da bist!</Text>
      <View style={styles.tileGrid}>
        <HomeTile icon="⚡" label="MOTIVATION" onPress={loadMotivation} />
        <HomeTile
          icon="🗓️"
          label="HEUTE"
          onPress={() => navigation.navigate("TodayHabits")}
        />
        <HomeTile
          icon="📊"
          label="STATS"
          onPress={() => navigation.navigate("Stats")}
        />
        <HomeTile
          icon="📋"
          label="ALLE HABITS"
          onPress={() => navigation.navigate("AllHabits")}
        />
        <HomeTile
          icon="🧠"
          label="ADHS-TIPPS"
          onPress={() => navigation.navigate("AdhdTips")}
        />
        <HomeTile
          icon="🎯"
          label="ZIELE"
          onPress={() => navigation.navigate("Goals")}
        />
      </View>

      <Pressable
        style={styles.addHabitButton}
        onPress={() => navigation.navigate("AddHabit")}
      >
        <Text style={styles.addHabitText}>＋ HABIT HINZUFÜGEN</Text>
      </Pressable>

      {loadingMotivation && <Text style={styles.loading}></Text>}
      {motivation && (
        <MotivationCard
          text={motivation}
          imageSource={motivationImage}
          visible={Boolean(motivation)}
          onClose={() => setMotivation(null)}
        />
      )}
      </ScrollView>
    </ImageBackground>
  );
}

function HomeTile({ icon, label, onPress }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  page: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  welcome: {
    color: "#3A236D",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  tile: {
    alignItems: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 136,
    padding: 12,
    width: "48.5%",
  },
  tileIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  tileLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  addHabitButton: {
    alignItems: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    marginTop: 18,
    paddingVertical: 16,
  },
  addHabitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  loading: {
    color: "#3A236D",
    marginTop: 12,
    textAlign: "center",
  },
};
