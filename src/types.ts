export interface TelemetryState {
  // Transport
  mileage: number;
  commuteFrequency: "DAILY" | "WEEKLY" | "REMOTE";
  vehicleType: string;
  flightsShortHaul: number;
  flightsLongHaul: number;
  // Energy
  utilityBill: number;
  energySource: "renewable" | "mixed" | "fossil";
  heatingType: "gas" | "electric" | "oil" | "heatpump" | "none";
  // Food
  meatIntake: string;
  foodWaste: "low" | "medium" | "high";
  // Shopping
  shoppingFrequency: "minimal" | "average" | "frequent";
  newElectronics: number;
  clothingType: "fast-fashion" | "sustainable" | "none";
  // Waste
  recycledPercent: number;
  // UI state
  category: "TRANSPORT" | "ENERGY" | "FOOD" | "WASTE" | "SHOPPING";
}

export interface EmissionsBreakdown {
  transport: number;
  energy: number;
  food: number;
  waste: number;
  shopping: number;
  total: number;
}

export interface ChallengeTask {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  status: "LOCKED" | "AVAILABLE" | "JOINED" | "COMPLETED";
  category: string;
  urgency?: string;
  xpReward: number;
  image: string;
  joinedAt?: number;
  progress?: number;
  tasks?: ChallengeTask[];
}

export interface ActivityLog {
  time: string;
  text: string;
  impact: string;
  type: "LOG" | "INIT" | "DATA" | "SYS";
}

export interface SimulationState {
  plantBased: boolean;
  solarConversion: boolean;
  evMobility: boolean;
}

export interface CommanderState {
  warning: string;
  action: string;
  projectedSaving: string;
  sector: string;
  status: "ACTIVE" | "DEPLOYED" | "DISMISSED";
}

export interface EmissionSnapshot {
  label: string;
  total: number;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}
