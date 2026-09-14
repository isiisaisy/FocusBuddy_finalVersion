import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "LAST_MOTIVATION";

// This API returns an ARRAY of quotes
const API_URL = "https://zenquotes.io/api/random";

const FALLBACK_TIPS = [
  "Start small. Even one minute counts 🌱",
  "You don’t have to finish — just begin 💡",
  "Progress is progress, no matter how small ✨",
  "Be kind to yourself today 💜",
];

export async function getMotivation() {
  try {
    console.log("Fetching motivation...");
    const res = await fetch(API_URL);
    console.log("API status:", res.status);

    if (!res.ok) throw new Error("Network error");

    const data = await res.json();
    console.log("API data:", data);

    // ✅ CORRECT FIELD
    const text = data?.[0]?.q;

    if (!text) throw new Error("Invalid API response");

    // save locally for offline use
    await AsyncStorage.setItem(STORAGE_KEY, text);
    return text;
  } catch (err) {
    console.log("Motivation API failed:", err);

    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) return saved;

    return FALLBACK_TIPS[
      Math.floor(Math.random() * FALLBACK_TIPS.length)
    ];
  }
}
