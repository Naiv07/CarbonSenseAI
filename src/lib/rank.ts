/**
 * Pure rank calculation — no side effects, no server state.
 * Used by server.ts and tested directly in tests/rank.test.ts.
 */

export function getRank(score: number): string {
  if (score <= 10) return "Recruit";
  if (score <= 20) return "Carbon Cadet";
  if (score <= 30) return "Eco Trainee";
  if (score <= 40) return "Green Operative";
  if (score <= 50) return "Climate Ranger";
  if (score <= 60) return "Sustainability Scout";
  if (score <= 70) return "Eco Specialist";
  if (score <= 80) return "Carbon Commander";
  if (score <= 90) return "Climate Guardian";
  return "Earth Sentinel";
}
