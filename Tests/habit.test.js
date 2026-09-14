import { createHabit } from "../models/Habit";

test("createHabit sets defaults and returns id", () => {
  const spy = jest.spyOn(Date, "now").mockReturnValue(12345);

  const h = createHabit({
    title: "Drink water",
    category: "",
    frequency: "daily",
    miniStep: "",
    daysOfWeek: [],
  });

  expect(h.id).toBe("12345");
  expect(h.title).toBe("Drink water");
  expect(h.category).toBeNull();
  expect(h.miniStep).toBe("");
  expect(h.habitDoneByDate).toEqual({});
  expect(h.miniStepDoneByDate).toEqual({});
  expect(h.reminderTime).toBeNull();
  expect(h.reminderNotificationIds).toEqual([]);

  spy.mockRestore();
});
