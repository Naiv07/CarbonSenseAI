import { describe, it, expect } from "vitest";
import { getRank } from "../src/lib/rank";

describe("getRank", () => {
  it("score 0 → Recruit", () => {
    expect(getRank(0)).toBe("Recruit");
  });

  it("score 10 → Recruit (upper boundary)", () => {
    expect(getRank(10)).toBe("Recruit");
  });

  it("score 11 → Carbon Cadet", () => {
    expect(getRank(11)).toBe("Carbon Cadet");
  });

  it("score 20 → Carbon Cadet (upper boundary)", () => {
    expect(getRank(20)).toBe("Carbon Cadet");
  });

  it("score 21 → Eco Trainee", () => {
    expect(getRank(21)).toBe("Eco Trainee");
  });

  it("score 40 → Green Operative (upper boundary)", () => {
    expect(getRank(40)).toBe("Green Operative");
  });

  it("score 41 → Climate Ranger", () => {
    expect(getRank(41)).toBe("Climate Ranger");
  });

  it("score 50 → Climate Ranger (upper boundary)", () => {
    expect(getRank(50)).toBe("Climate Ranger");
  });

  it("score 61 → Eco Specialist", () => {
    expect(getRank(61)).toBe("Eco Specialist");
  });

  it("score 75 → Carbon Commander", () => {
    expect(getRank(75)).toBe("Carbon Commander");
  });

  it("score 81 → Climate Guardian", () => {
    expect(getRank(81)).toBe("Climate Guardian");
  });

  it("score 90 → Climate Guardian (upper boundary)", () => {
    expect(getRank(90)).toBe("Climate Guardian");
  });

  it("score 91 → Earth Sentinel", () => {
    expect(getRank(91)).toBe("Earth Sentinel");
  });

  it("score 100 → Earth Sentinel (max)", () => {
    expect(getRank(100)).toBe("Earth Sentinel");
  });

  it("negative score → Recruit (treated as ≤10)", () => {
    expect(getRank(-5)).toBe("Recruit");
  });
});
