//converts a Date object into a standardized string key in the format YYYY-MM-DD.
//to store and access per-day completion data for habits and mini-steps.
export function getDateKey(date = new Date()) {
// Use local date parts (not toISOString/UTC) so the key matches the user's local calendar day
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
