import { getDateKey } from "../helper/date";

test("getDateKey returns YYYY-MM-DD", () => {
  const d = new Date("2026-01-24T12:34:56.000Z");
  expect(getDateKey(d)).toBe("2026-01-24");
});
