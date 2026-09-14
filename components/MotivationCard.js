// Import from React Native
// View: container for layout
// Text: displays the motivational message
// StyleSheet: defines reusable styles
import { Image, Modal, Pressable, Text, View, StyleSheet } from 'react-native';

//This component is used on the Home screen to show motivation fetched from API or a local fallback
export default function MotivationCard({
  text,
  imageSource,
  visible,
  onClose,
  eyebrow = 'MOTIVATIONSTEXT',
  buttonText = 'ZURÜCK',
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={styles.content}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.text}>{text}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>{buttonText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
//Styles for the MotivationCard component
const styles = StyleSheet.create({
  card: {
    width: '88%',
    maxWidth: 420,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(20, 13, 38, 0.68)',
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#F1EDFF',
  },
  content: {
    padding: 20,
  },
  eyebrow: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  text: {
    color: '#2B1857',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    marginTop: 20,
    paddingVertical: 13,
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
