// Import components from React Native
// TouchableOpacity: creates a tappable button
// Text: for button label
// StyleSheet: organizes styles
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

//Button used to mark a mini-step as completed.The logic is handled in the "HabitDetailScreen" via the onPress.
export default function MiniStepButton({ onPress }) {
  return (

    // TouchableOpacity gives visual feedback when pressed
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>Complete Mini-Step</Text>
    </TouchableOpacity>
  );
}
//Styles for the MiniStepButton component
const styles = StyleSheet.create({
  button: {
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginTop: 8,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
