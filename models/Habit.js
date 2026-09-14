export function createHabit({
  title,
  category,
  frequency,
  miniStep,
  miniSteps = [],
  daysOfWeek = [],
}) {
  const normalizedMiniSteps = miniSteps.length
    ? miniSteps.map((step, index) => ({
        id: step.id || `${Date.now()}-${index}`,
        title: typeof step === "string" ? step : step.title,
        doneByDate: step.doneByDate || {},
      }))
    : miniStep
      ? [{ id: `${Date.now()}-0`, title: miniStep, doneByDate: {} }]
      : [];

  return {
    id: Date.now().toString(),
    title,
    category: category || null,
    frequency,
    daysOfWeek,
    miniStep: miniStep || "",
    miniSteps: normalizedMiniSteps,
    habitDoneByDate: {},//Tracks whether the mini-step was completed on specific dates
    miniStepDoneByDate: {},
    reminderTime: null,
    reminderNotificationIds: [],//Stores notification IDs to allow canceling or updating reminders
  };
}
