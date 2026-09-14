import { ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";
import HeaderLogo from "../components/HeaderLogo";

const COLORS = {
  background: "#DEDAFF",
  primary: "#7C3AED",
  dark: "#3A236D",
  muted: "#6B5A91",
};

const TIPS = [
  {
    title: "Body Doubling",
    text: "Arbeite gemeinsam mit einer anderen Person, auch wenn ihr unterschiedliche Aufgaben macht. Die Anwesenheit kann den Einstieg erleichtern.",
  },
  {
    title: "Pomodoro-Technik",
    text: "Arbeite 25 Minuten und mache anschließend 5 Minuten Pause. Kurze, klare Zeitblöcke reduzieren Überforderungsgefühle.",
  },
  {
    title: "Externe Erinnerungen",
    text: "Verlasse dich nicht nur auf dein Gedächtnis. Nutze sichtbare Notizen, Timer und Erinnerungen genau dort, wo du sie brauchst.",
  },
  {
    title: "Aufgaben aufteilen",
    text: "Teile große Aufgaben in den kleinstmöglichen nächsten Schritt auf. Ein kleiner Anfang ist besser als ein perfekter Plan.",
  },
  {
    title: "Bewegung als Reset",
    text: "Ein kurzer Spaziergang, Dehnen oder ein Glas Wasser kann helfen, Aufmerksamkeit und Energie neu auszurichten.",
  },
  {
    title: "Dopamin-Pairing",
    text: "Verbinde eine unangenehme Aufgabe mit etwas Angenehmem, zum Beispiel Lieblingsmusik beim Aufräumen.",
  },
  {
    title: "Zeitblindheit überwinden",
    text: "Schätze nicht, wie lange etwas dauert. Stelle einen Timer und plane bewusst einen kleinen Zeitpuffer ein.",
  },
];

export default function AdhdTipsScreen() {
  const focused = useIsFocused();
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [tipOfTheDayIndex, setTipOfTheDayIndex] = useState(0);

  useEffect(() => {
    if (!focused) return;
    setTipOfTheDayIndex((previousIndex) => {
      const availableIndexes = TIPS.map((_, index) => index).filter(
        (index) => TIPS.length === 1 || index !== previousIndex
      );
      return availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    });
    setExpandedIndex(null);
  }, [focused]);

  const tipOfTheDay = TIPS[tipOfTheDayIndex];

  function toggleTip(index) {
    setExpandedIndex((current) => (current === index ? null : index));
  }

  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <HeaderLogo compact />
        <Text style={styles.title}>ADHS-Tipps</Text>

        <View style={styles.tipOfDay}>
          <Text style={styles.eyebrow}>✦ TIPP DES TAGES</Text>
          <Text style={styles.featureTitle}>{tipOfTheDay.title}</Text>
          <Text style={styles.featureText}>{tipOfTheDay.text}</Text>
        </View>

        <Text style={styles.listLabel}>ALLE TIPPS</Text>
        {TIPS.map((tip, index) => {
          const expanded = expandedIndex === index;
          return (
            <View key={tip.title} style={[styles.tipCard, expanded && styles.tipCardExpanded]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => toggleTip(index)}
                style={styles.tipHeader}
              >
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
              </Pressable>
              {expanded && <Text style={styles.tipText}>{tip.text}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = {
  page: { flexGrow: 1, padding: 16, paddingBottom: 30 },
  title: { color: COLORS.dark, fontSize: 23, fontWeight: "800", marginBottom: 14 },
  tipOfDay: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 18 },
  eyebrow: { color: "#DDD1FF", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 8 },
  featureTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  featureText: { color: "#F4F0FF", fontSize: 14, lineHeight: 21, marginTop: 8 },
  listLabel: { color: COLORS.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  tipCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8, overflow: "hidden" },
  tipCardExpanded: { backgroundColor: "#EDE7FA" },
  tipHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingHorizontal: 16 },
  tipTitle: { color: COLORS.dark, flex: 1, fontSize: 15, fontWeight: "800" },
  chevron: { color: "#A78BFA", fontSize: 23, fontWeight: "800", marginLeft: 10 },
  tipText: { color: COLORS.muted, fontSize: 14, lineHeight: 21, paddingBottom: 16, paddingHorizontal: 16 },
};
