import { ImageBackground, Text, View } from "react-native";
import HeaderLogo from "../components/HeaderLogo";

export default function FeaturePlaceholderScreen({ route }) {
  return (
    <ImageBackground
      source={require("../assets/purple-watercolour-background-corners.avif")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#DEDAFF",
        paddingHorizontal: 20,
      }}
    >
      <HeaderLogo compact />
      <Text style={{ color: "#3A236D", fontSize: 22, fontWeight: "700" }}>
        {route.params?.title}
      </Text>
      <Text style={{ color: "#5E4B85", marginTop: 12 }}>
        Diese Seite wird als Nächstes eingerichtet.
      </Text>
    </View>
    </ImageBackground>
  );
}
