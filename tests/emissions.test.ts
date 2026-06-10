import { describe, it, expect } from "vitest";
import { computeEmissions, computeMissionScore, type EmissionsInput } from "../src/lib/emissions";

const base: EmissionsInput = {
  mileage: 10000,
  commuteFrequency: "DAILY",
  vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
  flightsShortHaul: 0,
  flightsLongHaul: 0,
  utilityBill: 150,
  energySource: "mixed",
  heatingType: "none",
  meatIntake: "DAILY",
  foodWaste: "medium",
  recycledPercent: 50,
  shoppingFrequency: "average",
  newElectronics: 0,
  clothingType: "none",
};

describe("computeEmissions", () => {
  it("returns positive totals for baseline input", () => {
    const result = computeEmissions(base);
    expect(result.total).toBeGreaterThan(0);
    expect(result.transport).toBeGreaterThan(0);
    expect(result.energy).toBeGreaterThan(0);
    expect(result.food).toBeGreaterThan(0);
  });

  it("remote commute reduces transport emissions by ~90%", () => {
    const daily = computeEmissions(base);
    const remote = computeEmissions({ ...base, commuteFrequency: "REMOTE" });
    expect(remote.transport).toBeLessThan(daily.transport);
    // mileage contribution drops to 10% — should be substantially lower
    expect(remote.transport).toBeLessThan(daily.transport * 0.5);
  });

  it("electric vehicle reduces transport vs ICE", () => {
    const ice = computeEmissions(base);
    const ev = computeEmissions({ ...base, vehicleType: "ELECTRIC_BEV" });
    expect(ev.transport).toBeLessThan(ice.transport);
  });

  it("renewable energy reduces energy emissions vs mixed", () => {
    const mixed = computeEmissions(base);
    const renewable = computeEmissions({ ...base, energySource: "renewable" });
    expect(renewable.energy).toBeLessThan(mixed.energy);
  });

  it("vegan diet produces less food emissions than daily meat", () => {
    const meat = computeEmissions(base);
    const vegan = computeEmissions({ ...base, meatIntake: "VEGAN" });
    expect(vegan.food).toBeLessThan(meat.food);
  });

  it("100% recycling minimises waste emissions to zero", () => {
    const result = computeEmissions({ ...base, recycledPercent: 100 });
    expect(result.waste).toBe(0);
  });

  it("long-haul flights add significant transport emissions", () => {
    const noFlights = computeEmissions(base);
    const withFlights = computeEmissions({ ...base, flightsLongHaul: 2 });
    expect(withFlights.transport).toBeCloseTo(noFlights.transport + 2 * 1.56, 1);
  });

  it("all simulations active drastically cuts total emissions", () => {
    const noSim = computeEmissions(base);
    const withSim = computeEmissions(base, { plantBased: true, solarConversion: true, evMobility: true });
    expect(withSim.total).toBeLessThan(noSim.total * 0.5);
  });

  it("high shopping frequency produces more shopping emissions than minimal", () => {
    const minimal = computeEmissions({ ...base, shoppingFrequency: "minimal" });
    const frequent = computeEmissions({ ...base, shoppingFrequency: "frequent" });
    expect(frequent.shopping).toBeGreaterThan(minimal.shopping);
  });

  it("total equals sum of all categories", () => {
    const r = computeEmissions(base);
    const sum = Number((r.transport + r.energy + r.food + r.waste + r.shopping).toFixed(1));
    expect(r.total).toBe(sum);
  });

  it("zero mileage still produces transport emissions from flights", () => {
    const result = computeEmissions({ ...base, mileage: 0, flightsLongHaul: 1 });
    expect(result.transport).toBeGreaterThan(0);
  });

  it("10 long-haul flights produces large transport figure", () => {
    const result = computeEmissions({ ...base, mileage: 0, flightsLongHaul: 10 });
    expect(result.transport).toBeGreaterThan(10);
  });

  it("gas heating adds to energy emissions vs no heating", () => {
    const noHeat = computeEmissions({ ...base, heatingType: "none" });
    const gasHeat = computeEmissions({ ...base, heatingType: "gas" });
    expect(gasHeat.energy).toBeGreaterThan(noHeat.energy);
  });

  it("5 new electronics increases shopping emissions", () => {
    const noElec = computeEmissions({ ...base, newElectronics: 0 });
    const withElec = computeEmissions({ ...base, newElectronics: 5 });
    expect(withElec.shopping).toBeGreaterThan(noElec.shopping);
  });
});

describe("computeMissionScore", () => {
  it("returns 100 for zero emissions", () => {
    expect(computeMissionScore(0)).toBe(100);
  });

  it("returns 0 for emissions >= 12t", () => {
    expect(computeMissionScore(12)).toBe(0);
    expect(computeMissionScore(15)).toBe(0);
  });

  it("returns a score between 0 and 100 for typical emissions", () => {
    const score = computeMissionScore(5.8);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("lower emissions → higher score", () => {
    expect(computeMissionScore(3)).toBeGreaterThan(computeMissionScore(7));
  });

  it("exactly 4t (global average) → score between 50 and 80", () => {
    const score = computeMissionScore(4);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(80);
  });

  it("negative emissions → clamps to 100", () => {
    expect(computeMissionScore(-1)).toBe(100);
  });
});
