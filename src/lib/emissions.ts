/**
 * Pure emissions calculation logic — no side effects, no server state.
 * Used by server.ts, OnboardingView.tsx, and tested in tests/emissions.test.ts.
 */

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
} from "./constants";

export interface EmissionsInput {
  mileage: number;
  commuteFrequency: string;
  vehicleType: string;
  flightsShortHaul: number;
  flightsLongHaul: number;
  utilityBill: number;
  energySource: string;
  heatingType: string;
  meatIntake: string;
  foodWaste: string;
  recycledPercent: number;
  shoppingFrequency: string;
  newElectronics: number;
  clothingType: string;
}

export interface SimulationInput {
  plantBased: boolean;
  solarConversion: boolean;
  evMobility: boolean;
}

export interface EmissionsBreakdown {
  transport: number;
  energy: number;
  food: number;
  waste: number;
  shopping: number;
  total: number;
}

export function computeEmissions(
  t: EmissionsInput,
  sim?: SimulationInput,
): EmissionsBreakdown {
  // Transport
  let transportBase = (t.mileage * MILEAGE_FACTOR) / 1000;
  transportBase *= COMMUTE_MULTIPLIERS[t.commuteFrequency] ?? 1;
  transportBase *= VEHICLE_MULTIPLIERS[t.vehicleType] ?? 1;
  transportBase += t.flightsShortHaul * FLIGHT_SHORT_HAUL_FACTOR + t.flightsLongHaul * FLIGHT_LONG_HAUL_FACTOR;

  // Energy
  let energyBase = (t.utilityBill * 12 * UTILITY_BILL_FACTOR) / 1000;
  energyBase *= ENERGY_SOURCE_MULTIPLIERS[t.energySource] ?? 1;
  energyBase += HEATING_FACTORS[t.heatingType] ?? 0;

  // Food
  let foodBase = MEAT_INTAKE_BASE[t.meatIntake] ?? 1.8;
  foodBase *= FOOD_WASTE_MULTIPLIERS[t.foodWaste] ?? 1.0;

  // Waste
  const wasteBase = WASTE_BASE * (1 - t.recycledPercent / 100);

  // Shopping
  let shopping = SHOPPING_BASE[t.shoppingFrequency] ?? 0.5;
  shopping += t.newElectronics * ELECTRONICS_FACTOR;
  shopping += CLOTHING_FACTORS[t.clothingType] ?? 0;

  // Simulation modifiers
  if (sim) {
    if (sim.plantBased) foodBase *= SIM_PLANT_BASED_FACTOR;
    if (sim.solarConversion) energyBase *= SIM_SOLAR_FACTOR;
    if (sim.evMobility) transportBase *= SIM_EV_FACTOR;
  }

  const transport = Number(transportBase.toFixed(2));
  const energy = Number(energyBase.toFixed(2));
  const food = Number(foodBase.toFixed(2));
  const waste = Number(wasteBase.toFixed(2));
  const shoppingRounded = Number(shopping.toFixed(2));
  const total = Number((transport + energy + food + waste + shoppingRounded).toFixed(1));

  return { transport, energy, food, waste, shopping: shoppingRounded, total };
}

/** Simple 0-100 mission score based on total emissions */
export function computeMissionScore(total: number): number {
  if (total <= 0) return 100;
  if (total >= MAX_EMISSION_CAP) return 0;
  return Math.round(Math.max(0, Math.min(100, ((MAX_EMISSION_CAP - total) / MAX_EMISSION_CAP) * 100)));
}
