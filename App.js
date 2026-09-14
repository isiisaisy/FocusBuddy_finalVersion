// Must be imported first for React Navigation gesture support
import 'react-native-gesture-handler';
// Navigation container and stack navigator
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screen imports
import HomeScreen from './screens/HomeScreen';
import AddHabitScreen from './screens/AddHabitScreen';
import HabitDetailScreen from './screens/HabitDetailScreen';
import TodayHabitsScreen from "./screens/TodayHabitsScreen";
import StatsScreen from "./screens/StatsScreen";
import FeaturePlaceholderScreen from "./screens/FeaturePlaceholderScreen";
import AllHabitsScreen from "./screens/AllHabitsScreen";
import AdhdTipsScreen from "./screens/AdhdTipsScreen";
import GoalsScreen from "./screens/GoalsScreen";
import GoalListScreen from "./screens/GoalListScreen";
import StatsHabitsListScreen from "./screens/StatsHabitsListScreen";

// Used to suppress specific warning messages in development
import { LogBox, Pressable, StyleSheet, Text } from "react-native";
//Expo Go does not fully support remote push notifications,but local notifications still work correctly.
//Expo Fehlermeldung zu push notifications blocken
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications)",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

// Create a native stack navigator
const Stack = createNativeStackNavigator();

export default function App() {

  return (
    // NavigationContainer manages the navigation state
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation, route }) => ({
          headerLeft:
            route.name === "Home"
              ? undefined
              : () => (
                  <Pressable
                    accessibilityLabel="Zur Startseite"
                    accessibilityRole="button"
                    onPress={() => navigation.navigate("Home")}
                    style={styles.homeLink}
                  >
                    <Text style={styles.homeLinkText}>← Home</Text>
                  </Pressable>
                ),
        })}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="AddHabit"
          component={AddHabitScreen}
          options={{ title: "Add Habit" }}
        />
        <Stack.Screen
          name="TodayHabits"
          component={TodayHabitsScreen}
          options={{ title: "Heutige Habits" }}
        />
        <Stack.Screen
          name="HabitDetail"
          component={HabitDetailScreen}
          options={{ title: "Habit Details" }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: "Stats" }}
        />
        <Stack.Screen
          name="StatsHabitsList"
          component={StatsHabitsListScreen}
          options={{ title: "Heutige Habits" }}
        />
        <Stack.Screen
          name="AllHabits"
          component={AllHabitsScreen}
          options={{ title: "Alle Habits" }}
        />
        <Stack.Screen
          name="AdhdTips"
          component={AdhdTipsScreen}
          options={{ title: "ADHS-Tipps" }}
        />
        <Stack.Screen
          name="Goals"
          component={GoalsScreen}
          options={{ title: "Ziele" }}
        />
        <Stack.Screen
          name="GoalList"
          component={GoalListScreen}
          options={{ title: "Ziele" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  homeLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  homeLinkText: {
    color: "#6631D7",
    fontSize: 16,
    fontWeight: "700",
  },
});
