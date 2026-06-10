/**
 * Pure emissions calculation logic — no side effects, no server state.
 * Used by server.ts and tested directly in tests/emissions.test.ts.
 */

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
  let transportBase = (t.mileage * 0.18) / 1000;
  if (t.commuteFrequency === "WEEKLY") transportBase *= 0.6;
  if (t.commuteFrequency === "REMOTE") transportBase *= 0.1;
  if (t.vehicleType === "ELECTRIC_BEV") transportBase *= 0.15;
  else if (t.vehicleType === "HYBRID_PLUG_IN") transportBase *= 0.45;
  else if (t.vehicleType === "INTERNAL_COMBUSTION_LARGE") transportBase *= 1.3;
  transportBase += t.flightsShortHaul * 0.18 + t.flightsLongHaul * 1.56;

  // Energy
  let energyBase = (t.utilityBill * 12 * 0.38) / 1000;
  if (t.energySource === "renewable") energyBase *= 0.3;
  else if (t.energySource === "fossil") energyBase *= 1.4;
  const heatingFactors: Record<string, number> = { gas: 0.8, electric: 0.4, oil: 1.2, heatpump: 0.2, none: 0 };
  energyBase += heatingFactors[t.heatingType] ?? 0;

  // Food
  let foodBase =
    t.meatIntake === "VEGAN" ? 0.5 :
    t.meatIntake === "VEGETARIAN" ? 0.8 :
    t.meatIntake === "WEEKLY" ? 1.3 : 1.8;
  const foodWasteMultiplier: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.3 };
  foodBase *= foodWasteMultiplier[t.foodWaste] ?? 1.0;

  // Waste
  const wasteBase = 0.6 * (1 - t.recycledPercent / 100);

  // Shopping
  const shoppingBase: Record<string, number> = { minimal: 0.2, average: 0.5, frequent: 1.2 };
  let shopping = shoppingBase[t.shoppingFrequency] ?? 0.5;
  shopping += t.newElectronics * 0.3;
  const clothingFactors: Record<string, number> = { "fast-fashion": 0.8, sustainable: 0.2, none: 0 };
  shopping += clothingFactors[t.clothingType] ?? 0;

  // Simulation modifiers
  if (sim) {
    if (sim.plantBased) foodBase *= 0.2;
    if (sim.solarConversion) energyBase *= 0.3;
    if (sim.evMobility) transportBase *= 0.25;
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
  if (total >= 12) return 0;
  return Math.round(Math.max(0, Math.min(100, ((12 - total) / 12) * 100)));
}
