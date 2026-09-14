// Import basic layout and image components from React Native
// View: container element
// Image: used to display images (local or remote URLs)
import { View, Image } from "react-native";

//HeaderLogo:Reusable component that displays the logo in(Home, Detail, Stats)
export default function HeaderLogo({ compact = false }) {
  return (
    // Container that centers the logo horizontally
    <View style={{ alignItems: "center", marginTop: compact ? 4 : 34, marginBottom: compact ? 8 : 32 }}>
      <Image
        source={require("../assets/Focus Buddy_lilaOrange.png")}
        style={{ width: "100%", maxWidth: compact ? 360 : 440, height: compact ? 180 : 220 }}
        resizeMode="contain"
      />
    </View>
  );
}
