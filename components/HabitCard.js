// Import basic UI components from React Native
// View: container (like a div)
// Text: displays text
// StyleSheet: for defining styles
// TouchableOpacity: makes the card tappable
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HabitCard({
  title,
  category,
  frequency, // Daily / Weekly
  status,
  miniStep,
  miniStepDone,
  reminderTime,
  onPress,
  onEdit,
  onDelete,
}) {
  return (
    // Makes the entire card clickable (navigates to detail screen)
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {reminderTime ? <Text>⏰ Reminder: {reminderTime}</Text> : null}

        {category && <Text>Category: {category}</Text>}
        <Text>Frequency: {frequency}</Text>
        <Text>Status: {status}</Text>

        {miniStep && (
          <Text style={{ fontStyle: "italic" }}>Mini-step: {miniStep}</Text>
        )}

        {/* Visual feedback if mini-step is completed */} 
        {miniStepDone && (
          <Text style={{ color: "green" }}>✔️ Mini-step done</Text>
        )}

        <View style={styles.actions}>
          <Text style={styles.edit} onPress={onEdit}>
            Edit
          </Text>
          <Text style={styles.delete} onPress={onDelete}>
            Delete
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

//Styles using StyleSheet keeps styles organized and reusable
const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  edit: {
    color: "#6631D7",
    fontWeight: "600",
  },
  delete: {
    color: "#D32F2F",
    fontWeight: "600",
  },
});
