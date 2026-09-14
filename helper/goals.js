export function countGoalStars(habit) {
  return Object.values(habit.habitDoneByDate || {}).filter(Boolean).length;
}

export function reachedGoalForFirstTime(habit, wasDoneToday, dateKey) {
  if (wasDoneToday || !habit.goal?.title) return false;

  const previousStars = countGoalStars(habit);
  const target = Number(habit.goal.target) || 10;
  return previousStars < target && previousStars + 1 >= target && !habit.habitDoneByDate?.[dateKey];
}
