import { describe, it, expect } from "vitest";
import {
  MILEAGE_FACTOR,
  FLIGHT_SHORT_HAUL_FACTOR,
  FLIGHT_LONG_HAUL_FACTOR,
  UTILITY_BILL_FACTOR,
  COMMUTE_MULTIPLIERS,
  VEHICLE_MULTIPLIERS,
  ENERGY_SOURCE_MULTIPLIERS,
  HEATING_FACTORS,
  MEAT_INTAKE_BASE,
  FOOD_WASTE_MULTIPLIERS,
  WASTE_BASE,
  SHOPPING_BASE,
  ELECTRONICS_FACTOR,
  CLOTHING_FACTORS,
  SIM_PLANT_BASED_FACTOR,
  SIM_SOLAR_FACTOR,
  SIM_EV_FACTOR,
  MAX_EMISSION_CAP,
  CHALLENGE_BONUS_PER_JOIN,
  CHALLENGE_REFRESH_MS,
  HISTORY_SNAPSHOT_INTERVAL_MS,
  ACTIVITY_LOG_MAX,
  EMISSION_HISTORY_MAX,
} from "../src/lib/constants";

describe("Emission factor constants", () => {
  it("all transport factors are positive", () => {
    expect(MILEAGE_FACTOR).toBeGreaterThan(0);
    expect(FLIGHT_SHORT_HAUL_FACTOR).toBeGreaterThan(0);
    expect(FLIGHT_LONG_HAUL_FACTOR).toBeGreaterThan(0);
  });

  it("long-haul flight factor is greater than short-haul", () => {
    expect(FLIGHT_LONG_HAUL_FACTOR).toBeGreaterThan(FLIGHT_SHORT_HAUL_FACTOR);
  });

  it("utility bill factor is positive", () => {
    expect(UTILITY_BILL_FACTOR).toBeGreaterThan(0);
  });
});

describe("Multiplier lookup tables", () => {
  it("COMMUTE_MULTIPLIERS: REMOTE < WEEKLY < DAILY", () => {
    expect(COMMUTE_MULTIPLIERS.REMOTE).toBeLessThan(COMMUTE_MULTIPLIERS.WEEKLY);
    expect(COMMUTE_MULTIPLIERS.WEEKLY).toBeLessThan(COMMUTE_MULTIPLIERS.DAILY);
  });

  it("VEHICLE_MULTIPLIERS: EV < HYBRID < ICE_LARGE", () => {
    expect(VEHICLE_MULTIPLIERS.ELECTRIC_BEV).toBeLessThan(VEHICLE_MULTIPLIERS.HYBRID_PLUG_IN);
    expect(VEHICLE_MULTIPLIERS.HYBRID_PLUG_IN).toBeLessThan(VEHICLE_MULTIPLIERS.INTERNAL_COMBUSTION_LARGE);
  });

  it("ENERGY_SOURCE_MULTIPLIERS: renewable < mixed < fossil", () => {
    expect(ENERGY_SOURCE_MULTIPLIERS.renewable).toBeLessThan(ENERGY_SOURCE_MULTIPLIERS.mixed);
    expect(ENERGY_SOURCE_MULTIPLIERS.mixed).toBeLessThan(ENERGY_SOURCE_MULTIPLIERS.fossil);
  });

  it("HEATING_FACTORS: heatpump is lower impact than gas or oil", () => {
    expect(HEATING_FACTORS.heatpump).toBeLessThan(HEATING_FACTORS.gas);
    expect(HEATING_FACTORS.heatpump).toBeLessThan(HEATING_FACTORS.oil);
  });

  it("MEAT_INTAKE_BASE: VEGAN < VEGETARIAN < WEEKLY < DAILY", () => {
    expect(MEAT_INTAKE_BASE.VEGAN).toBeLessThan(MEAT_INTAKE_BASE.VEGETARIAN);
    expect(MEAT_INTAKE_BASE.VEGETARIAN).toBeLessThan(MEAT_INTAKE_BASE.WEEKLY);
    expect(MEAT_INTAKE_BASE.WEEKLY).toBeLessThan(MEAT_INTAKE_BASE.DAILY);
  });

  it("FOOD_WASTE_MULTIPLIERS: low < medium < high", () => {
    expect(FOOD_WASTE_MULTIPLIERS.low).toBeLessThan(FOOD_WASTE_MULTIPLIERS.medium);
    expect(FOOD_WASTE_MULTIPLIERS.medium).toBeLessThan(FOOD_WASTE_MULTIPLIERS.high);
  });

  it("SHOPPING_BASE: minimal < average < frequent", () => {
    expect(SHOPPING_BASE.minimal).toBeLessThan(SHOPPING_BASE.average);
    expect(SHOPPING_BASE.average).toBeLessThan(SHOPPING_BASE.frequent);
  });

  it("CLOTHING_FACTORS: sustainable < fast-fashion", () => {
    expect(CLOTHING_FACTORS.sustainable).toBeLessThan(CLOTHING_FACTORS["fast-fashion"]);
  });
});

describe("Simulation factors", () => {
  it("all simulation factors are between 0 and 1 (reduction multipliers)", () => {
    expect(SIM_PLANT_BASED_FACTOR).toBeGreaterThan(0);
    expect(SIM_PLANT_BASED_FACTOR).toBeLessThan(1);
    expect(SIM_SOLAR_FACTOR).toBeGreaterThan(0);
    expect(SIM_SOLAR_FACTOR).toBeLessThan(1);
    expect(SIM_EV_FACTOR).toBeGreaterThan(0);
    expect(SIM_EV_FACTOR).toBeLessThan(1);
  });
});

describe("System constants", () => {
  it("MAX_EMISSION_CAP is a reasonable upper bound", () => {
    expect(MAX_EMISSION_CAP).toBeGreaterThanOrEqual(10);
    expect(MAX_EMISSION_CAP).toBeLessThanOrEqual(20);
  });

  it("WASTE_BASE and ELECTRONICS_FACTOR are positive", () => {
    expect(WASTE_BASE).toBeGreaterThan(0);
    expect(ELECTRONICS_FACTOR).toBeGreaterThan(0);
  });

  it("CHALLENGE_BONUS_PER_JOIN is a positive integer", () => {
    expect(CHALLENGE_BONUS_PER_JOIN).toBeGreaterThan(0);
    expect(Number.isInteger(CHALLENGE_BONUS_PER_JOIN)).toBe(true);
  });

  it("CHALLENGE_REFRESH_MS is roughly 7 days", () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(CHALLENGE_REFRESH_MS).toBe(sevenDaysMs);
  });

  it("HISTORY_SNAPSHOT_INTERVAL_MS is roughly 1 day", () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    expect(HISTORY_SNAPSHOT_INTERVAL_MS).toBe(oneDayMs);
  });

  it("ACTIVITY_LOG_MAX and EMISSION_HISTORY_MAX are positive", () => {
    expect(ACTIVITY_LOG_MAX).toBeGreaterThan(0);
    expect(EMISSION_HISTORY_MAX).toBeGreaterThan(0);
  });
});
