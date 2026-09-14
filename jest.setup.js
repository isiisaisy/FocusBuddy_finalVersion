// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// react-native-gesture-handler mock
jest.mock("react-native-gesture-handler", () => ({
  Swipeable: jest.fn(),
  DrawerLayout: jest.fn(),
  State: {},
  PanGestureHandler: jest.fn(),
  TapGestureHandler: jest.fn(),
  LongPressGestureHandler: jest.fn(),
  NativeViewGestureHandler: jest.fn(),
  RotationGestureHandler: jest.fn(),
  FlingGestureHandler: jest.fn(),
  Directions: {},
}));
