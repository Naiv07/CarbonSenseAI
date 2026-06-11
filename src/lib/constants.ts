/**
 * Shared constants used across server and client.
 * Centralises magic numbers to a single source of truth.
 */

// --- Emission factors (tonnes CO₂e per unit) ---
export const MILEAGE_FACTOR = 0.18;           // kg CO₂ per km
export const FLIGHT_SHORT_HAUL_FACTOR = 0.18; // tonnes per round trip
export const FLIGHT_LONG_HAUL_FACTOR = 1.56;  // tonnes per round trip
export const UTILITY_BILL_FACTOR = 0.38;      // kg CO₂ per $ per month

export const COMMUTE_MULTIPLIERS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 0.6,
  REMOTE: 0.1,
};

export const VEHICLE_MULTIPLIERS: Record<string, number> = {
  INTERNAL_COMBUSTION_MEDIUM: 1,
  INTERNAL_COMBUSTION_LARGE: 1.3,
  HYBRID_PLUG_IN: 0.45,
  ELECTRIC_BEV: 0.15,
};

export const ENERGY_SOURCE_MULTIPLIERS: Record<string, number> = {
  mixed: 1,
  renewable: 0.3,
  fossil: 1.4,
};

export const HEATING_FACTORS: Record<string, number> = {
  gas: 0.8,
  electric: 0.4,
  oil: 1.2,
  heatpump: 0.2,
  none: 0,
};

export const MEAT_INTAKE_BASE: Record<string, number> = {
  VEGAN: 0.5,
  VEGETARIAN: 0.8,
  WEEKLY: 1.3,
  DAILY: 1.8,
};

export const FOOD_WASTE_MULTIPLIERS: Record<string, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
};

export const SHOPPING_BASE: Record<string, number> = {
  minimal: 0.2,
  average: 0.5,
  frequent: 1.2,
};

export const ELECTRONICS_FACTOR = 0.3;        // tonnes per new device per year

export const CLOTHING_FACTORS: Record<string, number> = {
  "fast-fashion": 0.8,
  sustainable: 0.2,
  none: 0,
};

export const WASTE_BASE = 0.6;                // tonnes CO₂e base waste footprint

// --- Simulation modifiers ---
export const SIM_PLANT_BASED_FACTOR = 0.2;
export const SIM_SOLAR_FACTOR = 0.3;
export const SIM_EV_FACTOR = 0.25;

// --- Scoring ---
export const MAX_EMISSION_CAP = 12;           // tonnes — score = 0 at this level
export const CHALLENGE_BONUS_PER_JOIN = 3;    // mission score bonus per joined challenge

// --- Time intervals ---
export const CHALLENGE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const HISTORY_SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000; // 1 day
export const ACTIVITY_LOG_MAX = 100;
export const EMISSION_HISTORY_MAX = 24;
