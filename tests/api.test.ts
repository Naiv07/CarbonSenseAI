import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../server";

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
    const statuses = res.body.challenges.map((c: any) => c.status);
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
    const joined = res.body.challenges.find((c: any) => c.id === "oper-zero-grid");
    expect(joined.status).toBe("JOINED");
  });

  it("joining again toggles challenge back to AVAILABLE", async () => {
    await request.post("/api/challenges/join").send({ id: "oper-zero-grid" });
    const res = await request
      .post("/api/challenges/join")
      .send({ id: "oper-zero-grid" });
    const challenge = res.body.challenges.find((c: any) => c.id === "oper-zero-grid");
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
    const challenge = res.body.challenges.find((c: any) => c.id === "oper-zero-grid");
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
