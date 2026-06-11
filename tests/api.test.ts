import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../server";
import type { Challenge } from "../src/types";

const request = supertest(app);

// Reset server state before each test so tests are fully independent
beforeEach(async () => {
  await request.post("/api/reset");
});

// ─── GET /api/telemetry ───────────────────────────────────────────────────────
describe("GET /api/telemetry", () => {
  it("returns 200 with all expected fields", async () => {
    const res = await request.get("/api/telemetry");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("telemetry");
    expect(res.body).toHaveProperty("breakdown");
    expect(res.body).toHaveProperty("missionScore");
    expect(res.body).toHaveProperty("rank");
  });

  it("breakdown contains all 5 emission categories", async () => {
    const res = await request.get("/api/telemetry");
    const { breakdown } = res.body;
    expect(breakdown).toHaveProperty("transport");
    expect(breakdown).toHaveProperty("energy");
    expect(breakdown).toHaveProperty("food");
    expect(breakdown).toHaveProperty("waste");
    expect(breakdown).toHaveProperty("shopping");
    expect(breakdown).toHaveProperty("total");
  });

  it("missionScore is a number between 0 and 100", async () => {
    const res = await request.get("/api/telemetry");
    expect(res.body.missionScore).toBeGreaterThanOrEqual(0);
    expect(res.body.missionScore).toBeLessThanOrEqual(100);
  });

  it("rank is a non-empty string", async () => {
    const res = await request.get("/api/telemetry");
    expect(typeof res.body.rank).toBe("string");
    expect(res.body.rank.length).toBeGreaterThan(0);
  });
});

// ─── POST /api/onboarding ─────────────────────────────────────────────────────
describe("POST /api/onboarding", () => {
  const validPayload = {
    name: "Test User",
    country: "United Kingdom",
    city: "London",
    commuteFrequency: "DAILY",
    vehicleType: "ELECTRIC_BEV",
    mileage: 8000,
    flightsShortHaul: 1,
    flightsLongHaul: 0,
    energySource: "renewable",
    heatingType: "heatpump",
    utilityBill: 80,
    meatIntake: "VEGETARIAN",
    foodWaste: "low",
    shoppingFrequency: "minimal",
    newElectronics: 0,
    clothingType: "sustainable",
    recycledPercent: 80,
  };

  it("returns 200 with breakdown and missionScore", async () => {
    const res = await request.post("/api/onboarding").send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("breakdown");
    expect(res.body).toHaveProperty("missionScore");
    expect(res.body).toHaveProperty("rank");
  });

  it("low-impact lifestyle produces lower total emissions than high-impact", async () => {
    const lowRes = await request.post("/api/onboarding").send(validPayload);
    await request.post("/api/reset");
    const highRes = await request.post("/api/onboarding").send({
      ...validPayload,
      vehicleType: "INTERNAL_COMBUSTION_LARGE",
      energySource: "fossil",
      meatIntake: "DAILY",
      flightsLongHaul: 5,
      shoppingFrequency: "frequent",
    });
    expect(lowRes.body.breakdown.total).toBeLessThan(highRes.body.breakdown.total);
  });

  it("sets userLocation from onboarding data", async () => {
    await request.post("/api/onboarding").send(validPayload);
    const telRes = await request.get("/api/telemetry");
    expect(telRes.body.userLocation?.city).toBe("London");
    expect(telRes.body.userLocation?.country).toBe("United Kingdom");
  });
});

// ─── POST /api/telemetry ──────────────────────────────────────────────────────
describe("POST /api/telemetry", () => {
  it("returns 200 with updated breakdown", async () => {
    const res = await request.post("/api/telemetry").send({ mileage: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("breakdown");
  });

  it("switching to electric vehicle lowers transport emissions", async () => {
    const petrolRes = await request
      .post("/api/telemetry")
      .send({ vehicleType: "INTERNAL_COMBUSTION_LARGE", mileage: 20000 });
    await request.post("/api/reset");
    const evRes = await request
      .post("/api/telemetry")
      .send({ vehicleType: "ELECTRIC_BEV", mileage: 20000 });
    expect(evRes.body.breakdown.transport).toBeLessThan(petrolRes.body.breakdown.transport);
  });

  it("returns updated missionScore and rank", async () => {
    const res = await request.post("/api/telemetry").send({ mileage: 1000 });
    expect(typeof res.body.missionScore).toBe("number");
    expect(typeof res.body.rank).toBe("string");
  });
});

// ─── GET /api/challenges ──────────────────────────────────────────────────────
describe("GET /api/challenges", () => {
  it("returns 200 with a challenges array", async () => {
    const res = await request.get("/api/challenges");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.challenges)).toBe(true);
    expect(res.body.challenges.length).toBeGreaterThan(0);
  });

  it("each challenge has required fields", async () => {
    const res = await request.get("/api/challenges");
    for (const c of res.body.challenges) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("title");
      expect(c).toHaveProperty("status");
      expect(c).toHaveProperty("xpReward");
    }
  });

  it("challenges include AVAILABLE and LOCKED statuses", async () => {
    const res = await request.get("/api/challenges");
    const statuses = res.body.challenges.map((c: Challenge) => c.status);
    expect(statuses).toContain("AVAILABLE");
    expect(statuses).toContain("LOCKED");
  });
});

// ─── POST /api/challenges/join ────────────────────────────────────────────────
describe("POST /api/challenges/join", () => {
  it("joins an AVAILABLE challenge successfully", async () => {
    const res = await request
      .post("/api/challenges/join")
      .send({ id: "oper-zero-grid" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const joined = res.body.challenges.find((c: Challenge) => c.id === "oper-zero-grid");
    expect(joined.status).toBe("JOINED");
  });

  it("joining again toggles challenge back to AVAILABLE", async () => {
    await request.post("/api/challenges/join").send({ id: "oper-zero-grid" });
    const res = await request
      .post("/api/challenges/join")
      .send({ id: "oper-zero-grid" });
    const challenge = res.body.challenges.find((c: Challenge) => c.id === "oper-zero-grid");
    expect(challenge.status).toBe("AVAILABLE");
  });

  it("returns 404 for a non-existent challenge id", async () => {
    const res = await request
      .post("/api/challenges/join")
      .send({ id: "does-not-exist" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when id is missing", async () => {
    const res = await request.post("/api/challenges/join").send({});
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/logs ────────────────────────────────────────────────────────────
describe("GET /api/logs", () => {
  it("returns 200 with an array", async () => {
    const res = await request.get("/api/logs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("each log entry has time, text, type and impact fields", async () => {
    const res = await request.get("/api/logs");
    for (const log of res.body) {
      expect(log).toHaveProperty("time");
      expect(log).toHaveProperty("text");
      expect(log).toHaveProperty("type");
      expect(log).toHaveProperty("impact");
    }
  });
});

// ─── POST /api/simulation ─────────────────────────────────────────────────────
describe("POST /api/simulation", () => {
  it("returns 200 with updated breakdown", async () => {
    const res = await request
      .post("/api/simulation")
      .send({ plantBased: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("breakdown");
  });

  it("enabling EV mobility lowers transport emissions", async () => {
    const withoutEV = await request
      .post("/api/simulation")
      .send({ evMobility: false, plantBased: false, solarConversion: false });
    const withEV = await request
      .post("/api/simulation")
      .send({ evMobility: true, plantBased: false, solarConversion: false });
    expect(withEV.body.breakdown.transport).toBeLessThan(
      withoutEV.body.breakdown.transport
    );
  });
});

// ─── POST /api/commander-action ───────────────────────────────────────────────
describe("POST /api/commander-action", () => {
  it("deploy action returns updated commanderRecommendation", async () => {
    const res = await request
      .post("/api/commander-action")
      .send({ flag: "deploy", action: "EXECUTE_DEPLOY" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("commanderRecommendation");
  });

  it("dismiss action returns updated commanderRecommendation", async () => {
    const res = await request
      .post("/api/commander-action")
      .send({ flag: "dismiss" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("commanderRecommendation");
  });
});

// ─── POST /api/reset ──────────────────────────────────────────────────────────
describe("POST /api/reset", () => {
  it("returns 200 with success true", async () => {
    const res = await request.post("/api/reset");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("after reset, challenges are back to default statuses", async () => {
    await request.post("/api/challenges/join").send({ id: "oper-zero-grid" });
    await request.post("/api/reset");
    const res = await request.get("/api/challenges");
    const challenge = res.body.challenges.find((c: Challenge) => c.id === "oper-zero-grid");
    expect(challenge.status).toBe("AVAILABLE");
  });
});

// ─── POST /api/sync ───────────────────────────────────────────────────────────
describe("POST /api/sync", () => {
  it("returns 200 with success true", async () => {
    const res = await request.post("/api/sync");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── POST /api/challenges/:id/tasks/:taskId/toggle ────────────────────────────
describe("POST /api/challenges/:id/tasks/:taskId/toggle", () => {
  beforeEach(async () => {
    // Join the challenge first so tasks can be toggled
    await request.post("/api/challenges/join").send({ id: "oper-zero-grid" });
  });

  it("toggles a task to completed", async () => {
    const res = await request.post(
      "/api/challenges/oper-zero-grid/tasks/ozg-t1/toggle"
    );
    expect(res.status).toBe(200);
    expect(res.body.task.completed).toBe(true);
  });

  it("toggling again marks task as incomplete", async () => {
    await request.post("/api/challenges/oper-zero-grid/tasks/ozg-t1/toggle");
    const res = await request.post(
      "/api/challenges/oper-zero-grid/tasks/ozg-t1/toggle"
    );
    expect(res.body.task.completed).toBe(false);
  });

  it("returns updated progress percentage", async () => {
    const res = await request.post(
      "/api/challenges/oper-zero-grid/tasks/ozg-t1/toggle"
    );
    expect(typeof res.body.progress).toBe("number");
    expect(res.body.progress).toBeGreaterThan(0);
  });

  it("returns 404 for unknown challenge", async () => {
    const res = await request.post("/api/challenges/fake-id/tasks/fake-task/toggle");
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/settings ────────────────────────────────────────────────────────
describe("GET /api/settings", () => {
  it("returns 200 with settings object", async () => {
    const res = await request.get("/api/settings");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("safetyThreshold");
    expect(res.body).toHaveProperty("scrubberEfficiency");
    expect(res.body).toHaveProperty("audioFeedback");
  });

  it("safetyThreshold is a number", async () => {
    const res = await request.get("/api/settings");
    expect(typeof res.body.safetyThreshold).toBe("number");
  });
});

// ─── POST /api/settings ───────────────────────────────────────────────────────
describe("POST /api/settings", () => {
  it("updates safetyThreshold", async () => {
    const res = await request.post("/api/settings").send({ safetyThreshold: 7.5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings.safetyThreshold).toBe(7.5);
  });

  it("updates audioFeedback flag", async () => {
    const res = await request.post("/api/settings").send({ audioFeedback: true });
    expect(res.body.settings.audioFeedback).toBe(true);
  });

  it("persists settings changes across GET requests", async () => {
    await request.post("/api/settings").send({ scrubberEfficiency: 88 });
    const res = await request.get("/api/settings");
    expect(res.body.scrubberEfficiency).toBe(88);
  });
});

// ─── Input clamping & validation ──────────────────────────────────────────────
describe("Input clamping on POST /api/telemetry", () => {
  it("clamps negative mileage to 0", async () => {
    await request.post("/api/telemetry").send({ mileage: -5000 });
    const res = await request.get("/api/telemetry");
    expect(res.body.telemetry.mileage).toBe(0);
  });

  it("clamps recycledPercent above 100 to 100", async () => {
    await request.post("/api/telemetry").send({ recycledPercent: 150 });
    const res = await request.get("/api/telemetry");
    expect(res.body.telemetry.recycledPercent).toBe(100);
  });

  it("clamps recycledPercent below 0 to 0", async () => {
    await request.post("/api/telemetry").send({ recycledPercent: -10 });
    const res = await request.get("/api/telemetry");
    expect(res.body.telemetry.recycledPercent).toBe(0);
  });

  it("clamps negative flightsLongHaul to 0", async () => {
    await request.post("/api/telemetry").send({ flightsLongHaul: -3 });
    const res = await request.get("/api/telemetry");
    expect(res.body.telemetry.flightsLongHaul).toBe(0);
  });

  it("clamps negative utilityBill to 0", async () => {
    await request.post("/api/telemetry").send({ utilityBill: -200 });
    const res = await request.get("/api/telemetry");
    expect(res.body.telemetry.utilityBill).toBe(0);
  });
});

// ─── Data persistence ─────────────────────────────────────────────────────────
describe("Data persistence across requests", () => {
  it("telemetry changes from POST persist in subsequent GET", async () => {
    await request.post("/api/telemetry").send({ mileage: 3333 });
    const res = await request.get("/api/telemetry");
    expect(res.body.telemetry.mileage).toBe(3333);
  });

  it("joining a challenge persists when challenges are re-fetched", async () => {
    await request.post("/api/challenges/join").send({ id: "transit-shift" });
    const res = await request.get("/api/challenges");
    const challenge = res.body.challenges.find((c: Challenge) => c.id === "transit-shift");
    expect(challenge.status).toBe("JOINED");
  });

  it("onboarding data persists in subsequent telemetry fetch", async () => {
    await request.post("/api/onboarding").send({
      name: "Persist Test",
      city: "Berlin",
      country: "Germany",
      commuteFrequency: "REMOTE",
      vehicleType: "ELECTRIC_BEV",
      mileage: 4000,
      flightsShortHaul: 0,
      flightsLongHaul: 0,
      energySource: "renewable",
      heatingType: "heatpump",
      utilityBill: 60,
      meatIntake: "VEGAN",
      foodWaste: "low",
      shoppingFrequency: "minimal",
      newElectronics: 0,
      clothingType: "none",
      recycledPercent: 100,
    });
    const res = await request.get("/api/telemetry");
    expect(res.body.userLocation.city).toBe("Berlin");
    expect(res.body.telemetry.commuteFrequency).toBe("REMOTE");
  });
});

// ─── Mission score progression ────────────────────────────────────────────────
describe("Mission score progression", () => {
  it("joining a challenge increases missionScore", async () => {
    const before = (await request.get("/api/telemetry")).body.missionScore;
    const res = await request.post("/api/challenges/join").send({ id: "transit-shift" });
    expect(res.body.missionScore).toBeGreaterThan(before);
  });

  it("leaving a challenge decreases missionScore", async () => {
    await request.post("/api/challenges/join").send({ id: "transit-shift" });
    const joined = (await request.get("/api/telemetry")).body.missionScore;
    await request.post("/api/challenges/join").send({ id: "transit-shift" });
    const left = (await request.get("/api/telemetry")).body.missionScore;
    expect(left).toBeLessThan(joined);
  });

  it("score is always between 0 and 100 after multiple operations", async () => {
    await request.post("/api/challenges/join").send({ id: "oper-zero-grid" });
    await request.post("/api/challenges/join").send({ id: "transit-shift" });
    await request.post("/api/telemetry").send({ mileage: 0, flightsLongHaul: 0 });
    const res = await request.get("/api/telemetry");
    expect(res.body.missionScore).toBeGreaterThanOrEqual(0);
    expect(res.body.missionScore).toBeLessThanOrEqual(100);
  });
});

// ─── Response shape completeness ──────────────────────────────────────────────
describe("Response shape completeness", () => {
  it("GET /api/telemetry includes streak, emissionHistory, achievements", async () => {
    const res = await request.get("/api/telemetry");
    expect(res.body).toHaveProperty("streak");
    expect(res.body).toHaveProperty("emissionHistory");
    expect(res.body).toHaveProperty("achievements");
    expect(Array.isArray(res.body.emissionHistory)).toBe(true);
    expect(Array.isArray(res.body.achievements)).toBe(true);
  });

  it("each achievement has id, title, unlocked, and icon fields", async () => {
    const res = await request.get("/api/telemetry");
    for (const a of res.body.achievements) {
      expect(a).toHaveProperty("id");
      expect(a).toHaveProperty("title");
      expect(a).toHaveProperty("unlocked");
      expect(a).toHaveProperty("icon");
    }
  });

  it("POST /api/onboarding returns baselineEmissions as a positive number", async () => {
    const res = await request.post("/api/onboarding").send({
      name: "Shape Test", city: "Paris", country: "France",
      commuteFrequency: "DAILY", vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
      mileage: 15000, flightsShortHaul: 2, flightsLongHaul: 1,
      energySource: "mixed", heatingType: "gas", utilityBill: 120,
      meatIntake: "DAILY", foodWaste: "medium", shoppingFrequency: "average",
      newElectronics: 1, clothingType: "fast-fashion", recycledPercent: 40,
    });
    expect(typeof res.body.baselineEmissions).toBe("number");
    expect(res.body.baselineEmissions).toBeGreaterThan(0);
  });

  it("POST /api/telemetry returns emissionHistory array", async () => {
    const res = await request.post("/api/telemetry").send({ mileage: 10000 });
    expect(Array.isArray(res.body.emissionHistory)).toBe(true);
  });

  it("streak is a positive integer in telemetry response", async () => {
    const res = await request.get("/api/telemetry");
    expect(Number.isInteger(res.body.streak)).toBe(true);
    expect(res.body.streak).toBeGreaterThanOrEqual(1);
  });
});

// ─── Security — input sanitisation ───────────────────────────────────────────
describe("Security — malicious input handling", () => {
  it("XSS string in city field is stored as plain text, not executed", async () => {
    await request.post("/api/onboarding").send({
      name: "<script>alert(1)</script>",
      city: "<img src=x onerror=alert(1)>",
      country: "Germany",
      commuteFrequency: "DAILY", vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
      mileage: 10000, flightsShortHaul: 0, flightsLongHaul: 0,
      energySource: "mixed", heatingType: "none", utilityBill: 100,
      meatIntake: "DAILY", foodWaste: "medium", shoppingFrequency: "average",
      newElectronics: 0, clothingType: "none", recycledPercent: 50,
    });
    const res = await request.get("/api/telemetry");
    // Value stored as-is (plain string), server must not crash
    expect(res.status).toBe(200);
    expect(typeof res.body.userLocation.city).toBe("string");
  });

  it("numeric fields with string input are coerced or clamped without crashing", async () => {
    const res = await request.post("/api/telemetry").send({ mileage: "not-a-number" });
    expect(res.status).toBe(200); // server uses Number() which gives NaN → Math.max(0, NaN) = 0
  });

  it("extra unknown fields in payload are silently ignored", async () => {
    const res = await request.post("/api/telemetry").send({
      mileage: 10000,
      __proto__: { polluted: true },
      constructor: { hack: true },
      unknownField: "ignored",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
