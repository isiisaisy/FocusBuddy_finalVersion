// kleine Motivationstexte für abgehakte Mini-Steps / Habits
const MOTIVATION_TEXTS = [
  "Starke Leistung! Du bist auf dem richtigen Weg 💪",
  "Jeder Schritt zählt – weiter so! 🌟",
  "Du machst das großartig! 💯",
  "Fortschritt schlägt Perfektion. Immer weiter! 🚀",
];

export function getMotivationText() {
  return MOTIVATION_TEXTS[Math.floor(Math.random() * MOTIVATION_TEXTS.length)];
}
