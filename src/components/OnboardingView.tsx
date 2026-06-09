import React, { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle, Car, Zap, ShoppingBag, Terminal, Rocket } from "lucide-react";
import { getCurrencySymbol } from "../utils/currency";

export interface OnboardingData {
  name: string;
  country: string;
  city: string;
  commuteFrequency: "DAILY" | "WEEKLY" | "REMOTE";
  vehicleType: string;
  mileage: number;
  flightsShortHaul: number;
  flightsLongHaul: number;
  energySource: "renewable" | "mixed" | "fossil";
  heatingType: "gas" | "electric" | "oil" | "heatpump" | "none";
  utilityBill: number;
  meatIntake: string;
  foodWaste: "low" | "medium" | "high";
  shoppingFrequency: "minimal" | "average" | "frequent";
  newElectronics: number;
  clothingType: "fast-fashion" | "sustainable" | "none";
  recycledPercent: number;
}

interface Props {
  onComplete: (data: OnboardingData) => Promise<void>;
}

const COUNTRIES = [
  "Argentina", "Australia", "Brazil", "Canada", "Chile", "China", "Colombia",
  "Denmark", "Egypt", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Kenya", "Mexico", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Pakistan", "Philippines", "Poland", "Portugal", "Saudi Arabia", "Singapore",
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand",
  "Turkey", "UAE", "United Kingdom", "United States", "Vietnam",
];

// Client-side emission estimate — mirrors server calculateEmissions(skipSimulation=true)
function estimateBaseline(d: OnboardingData): { transport: number; energy: number; food: number; waste: number; shopping: number; total: number } {
  let transport = (d.mileage * 0.18) / 1000;
  if (d.commuteFrequency === "WEEKLY") transport *= 0.6;
  if (d.commuteFrequency === "REMOTE") transport *= 0.1;
  if (d.vehicleType === "ELECTRIC_BEV") transport *= 0.15;
  else if (d.vehicleType === "HYBRID_PLUG_IN") transport *= 0.45;
  else if (d.vehicleType === "INTERNAL_COMBUSTION_LARGE") transport *= 1.3;
  transport += d.flightsShortHaul * 0.18 + d.flightsLongHaul * 1.56;

  let energy = (d.utilityBill * 12 * 0.38) / 1000;
  if (d.energySource === "renewable") energy *= 0.3;
  else if (d.energySource === "fossil") energy *= 1.4;
  const heatingMap: Record<string, number> = { gas: 0.8, electric: 0.4, oil: 1.2, heatpump: 0.2, none: 0 };
  energy += heatingMap[d.heatingType] ?? 0;

  let food = d.meatIntake === "VEGAN" ? 0.5 : d.meatIntake === "VEGETARIAN" ? 0.8 : d.meatIntake === "WEEKLY" ? 1.3 : 1.8;
  const wasteMap: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.3 };
  food *= wasteMap[d.foodWaste] ?? 1;

  const waste = 0.6 * (1 - d.recycledPercent / 100);

  const shopBase: Record<string, number> = { minimal: 0.2, average: 0.5, frequent: 1.2 };
  let shopping = shopBase[d.shoppingFrequency] ?? 0.5;
  shopping += d.newElectronics * 0.3;
  const clothMap: Record<string, number> = { "fast-fashion": 0.8, sustainable: 0.2, none: 0 };
  shopping += clothMap[d.clothingType] ?? 0;

  return {
    transport: Number(transport.toFixed(2)),
    energy: Number(energy.toFixed(2)),
    food: Number(food.toFixed(2)),
    waste: Number(waste.toFixed(2)),
    shopping: Number(shopping.toFixed(2)),
    total: Number((transport + energy + food + waste + shopping).toFixed(1)),
  };
}

const STEP_LABELS = ["", "IDENTITY", "TRANSPORT", "ENERGY", "DIET", "LIFESTYLE"];

export default function OnboardingView({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [data, setData] = useState<OnboardingData>({
    name: "",
    country: "United States",
    city: "",
    commuteFrequency: "DAILY",
    vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
    mileage: 15000,
    flightsShortHaul: 2,
    flightsLongHaul: 1,
    energySource: "mixed",
    heatingType: "gas",
    utilityBill: 120,
    meatIntake: "DAILY",
    foodWaste: "medium",
    shoppingFrequency: "average",
    newElectronics: 1,
    clothingType: "fast-fashion",
    recycledPercent: 40,
  });

  const set = (patch: Partial<OnboardingData>) => {
    setValidationError("");
    setData(prev => ({ ...prev, ...patch }));
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!data.name.trim()) { setValidationError("Commander name is required."); return false; }
      if (!data.city.trim()) { setValidationError("City is required."); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setValidationError("");
    setStep(s => s + 1);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    await onComplete(data);
    setIsSubmitting(false);
  };

  const currencySymbol = getCurrencySymbol(data.country);
  const est = estimateBaseline(data);
  const baselineColor = est.total < 4 ? "#00ff66" : est.total < 7 ? "#ffcc00" : "#ff6b6b";
  const baselineLabel = est.total < 4 ? "LOW IMPACT" : est.total < 7 ? "MODERATE IMPACT" : est.total < 10 ? "HIGH IMPACT" : "CRITICAL IMPACT";

  return (
    <main className="min-h-screen bg-[#070708] technical-grid relative flex items-center justify-center p-4 overflow-hidden">
      <div className="scanline"></div>
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#5e6bff]/8 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl">

        {/* ── STEP 0: Welcome ─────────────────────────────── */}
        {step === 0 && (
          <div className="bg-[#101112]/95 border border-[#1f2023] rounded-3xl p-8 md:p-12 space-y-8 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue/10 border border-brand-blue/20 rounded flex items-center justify-center">
                <Terminal className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-brand-blue tracking-[0.3em] uppercase">Mission Initialization Protocol</p>
                <p className="text-[9px] font-mono text-[#888888] tracking-wider">PROTOCOL_V1.0 · CLIMATE COMMAND SYSTEM</p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
                Before We Begin,<br />
                <span className="text-brand-blue">We Need Your Data.</span>
              </h1>
              <p className="text-sm text-[#888888] leading-relaxed font-sans max-w-lg">
                To calculate your personal carbon baseline and Mission Score, we need a quick briefing on your lifestyle. Takes about 2 minutes. All values can be updated later in the Calculator.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[10px] font-mono">
              {[
                { icon: Car, label: "TRANSPORT", desc: "Vehicle & flights" },
                { icon: Zap, label: "ENERGY", desc: "Home & heating" },
                { icon: ShoppingBag, label: "LIFESTYLE", desc: "Diet & shopping" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="p-3 bg-brand-black border border-[#1f2023] rounded-xl flex flex-col gap-1.5">
                  <Icon className="w-4 h-4 text-brand-blue" />
                  <span className="font-bold text-white tracking-widest">{label}</span>
                  <span className="text-[#888888]">{desc}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full py-4 bg-brand-blue text-brand-black font-mono font-extrabold text-sm tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,242,255,0.3)] uppercase"
            >
              BEGIN INITIALIZATION
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* ── STEPS 1–5: Form steps ────────────────────────── */}
        {step >= 1 && step <= 5 && (
          <div className="bg-[#101112]/95 border border-[#1f2023] rounded-3xl p-8 space-y-6 shadow-[0_0_60px_rgba(0,0,0,0.8)]">

            {/* Progress header */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-mono font-bold text-[#888888] tracking-[0.25em] uppercase">
                  STEP {step} / 5 · {STEP_LABELS[step]}
                </p>
                <span className="text-[10px] font-mono text-brand-blue font-bold">{step * 20}%</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-brand-green" : i === step ? "bg-brand-blue" : "bg-brand-border"}`} />
                ))}
              </div>
            </div>

            {/* ── Step 1: Identity ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Commander Identity</h2>
                  <p className="text-xs text-[#888888] mt-1">Who&apos;s taking command of this mission?</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Commander Name</label>
                    <input
                      type="text"
                      value={data.name}
                      onChange={e => set({ name: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue placeholder-[#444444]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Country</label>
                      <select
                        value={data.country}
                        onChange={e => set({ country: e.target.value })}
                        className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue"
                      >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">City</label>
                      <input
                        type="text"
                        value={data.city}
                        onChange={e => set({ city: e.target.value })}
                        placeholder="e.g. New York"
                        className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue placeholder-[#444444]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Transport ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Mobility Vector</h2>
                  <p className="text-xs text-[#888888] mt-1">How do you get around?</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Commute Frequency</label>
                    <div className="bg-brand-black border border-brand-border p-1.5 flex rounded-xl">
                      {(["DAILY", "WEEKLY", "REMOTE"] as const).map(f => (
                        <button key={f} onClick={() => set({ commuteFrequency: f })}
                          className={`flex-1 py-2 text-[10px] font-mono font-bold tracking-wider rounded-[8px] uppercase transition-colors ${data.commuteFrequency === f ? "bg-brand-blue text-brand-black" : "text-[#888888] hover:text-white"}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Vehicle Type</label>
                    <select value={data.vehicleType} onChange={e => set({ vehicleType: e.target.value })}
                      className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue">
                      <option value="INTERNAL_COMBUSTION_MEDIUM">Petrol / Diesel — Medium</option>
                      <option value="INTERNAL_COMBUSTION_LARGE">Petrol / Diesel — Large / SUV</option>
                      <option value="HYBRID_PLUG_IN">Plug-in Hybrid</option>
                      <option value="ELECTRIC_BEV">Electric Vehicle (BEV)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Annual Mileage</label>
                      <span className="text-sm font-mono font-bold text-brand-blue">{data.mileage.toLocaleString()} KM</span>
                    </div>
                    <input type="range" min="1000" max="60000" step="500" value={data.mileage}
                      onChange={e => set({ mileage: Number(e.target.value) })}
                      className="w-full h-1 bg-brand-black rounded-lg cursor-pointer" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Short Flights / Yr</label>
                      <input type="number" min="0" max="50" value={data.flightsShortHaul}
                        onChange={e => set({ flightsShortHaul: Number(e.target.value) })}
                        className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue" />
                      <p className="text-[9px] font-mono text-[#888888]">~0.18t CO2 each</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Long Flights / Yr</label>
                      <input type="number" min="0" max="20" value={data.flightsLongHaul}
                        onChange={e => set({ flightsLongHaul: Number(e.target.value) })}
                        className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue" />
                      <p className="text-[9px] font-mono text-[#888888]">~1.56t CO2 each</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Energy ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Power Grid Analysis</h2>
                  <p className="text-xs text-[#888888] mt-1">What powers your home?</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Energy Source</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "renewable", label: "RENEWABLE", sub: "Solar / Wind" },
                        { id: "mixed", label: "MIXED GRID", sub: "Standard" },
                        { id: "fossil", label: "FOSSIL FUEL", sub: "Coal / Gas" },
                      ] as const).map(s => (
                        <button key={s.id} onClick={() => set({ energySource: s.id })}
                          className={`p-3 border rounded-xl text-center transition-all ${data.energySource === s.id ? "bg-brand-blue/10 border-brand-blue text-white" : "bg-brand-black border-brand-border text-[#888888] hover:text-white hover:bg-brand-border"}`}>
                          <span className="block text-[10px] font-mono font-bold tracking-widest">{s.label}</span>
                          <span className="block text-[9px] font-mono text-[#888888] mt-0.5">{s.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Heating Type</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {([
                        { id: "none", label: "NONE" },
                        { id: "heatpump", label: "HEAT PUMP" },
                        { id: "electric", label: "ELECTRIC" },
                        { id: "gas", label: "GAS" },
                        { id: "oil", label: "OIL" },
                      ] as const).map(h => (
                        <button key={h.id} onClick={() => set({ heatingType: h.id })}
                          className={`p-2.5 border rounded-[10px] text-center transition-all ${data.heatingType === h.id ? "bg-brand-blue/10 border-brand-blue text-white" : "bg-brand-black border-brand-border text-[#888888] hover:text-white hover:bg-brand-border"}`}>
                          <span className="text-[9px] font-mono font-bold tracking-widest">{h.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Monthly Electricity Bill</label>
                      <span className="text-sm font-mono font-bold text-brand-blue">{currencySymbol}{data.utilityBill}/mo</span>
                    </div>
                    <input type="range" min="10" max="500" step="10" value={data.utilityBill}
                      onChange={e => set({ utilityBill: Number(e.target.value) })}
                      className="w-full h-1 bg-brand-black rounded-lg cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Diet ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Nutritional Matrix</h2>
                  <p className="text-xs text-[#888888] mt-1">Your diet significantly impacts your carbon footprint.</p>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Diet Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "DAILY", label: "DAILY MEAT", sub: "1.8t CO2/yr baseline" },
                        { id: "WEEKLY", label: "WEEKLY MEAT", sub: "1.3t CO2/yr baseline" },
                        { id: "VEGETARIAN", label: "VEGETARIAN", sub: "0.8t CO2/yr baseline" },
                        { id: "VEGAN", label: "VEGAN", sub: "0.5t CO2/yr baseline" },
                      ].map(d => (
                        <button key={d.id} onClick={() => set({ meatIntake: d.id })}
                          className={`p-3 border rounded-xl text-left transition-all ${data.meatIntake === d.id ? "bg-brand-blue/10 border-brand-blue text-white" : "bg-brand-black border-brand-border text-[#888888] hover:text-white hover:bg-brand-border"}`}>
                          <span className="block text-[10px] font-mono font-bold tracking-widest">{d.label}</span>
                          <span className="block text-[9px] font-mono text-[#888888] mt-0.5">{d.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Food Waste Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "low", label: "LOW", sub: "Meal plan / minimal" },
                        { id: "medium", label: "MEDIUM", sub: "Average household" },
                        { id: "high", label: "HIGH", sub: "Frequent disposal" },
                      ] as const).map(fw => (
                        <button key={fw.id} onClick={() => set({ foodWaste: fw.id })}
                          className={`p-3 border rounded-xl text-center transition-all ${data.foodWaste === fw.id ? "bg-brand-green/10 border-brand-green text-white" : "bg-brand-black border-brand-border text-[#888888] hover:text-white hover:bg-brand-border"}`}>
                          <span className="block text-[10px] font-mono font-bold tracking-widest">{fw.label}</span>
                          <span className="block text-[9px] font-mono text-[#888888] mt-0.5">{fw.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 5: Lifestyle ── */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white uppercase tracking-tight">Consumer Pattern</h2>
                  <p className="text-xs text-[#888888] mt-1">Shopping habits and waste management.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Shopping Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "minimal", label: "MINIMAL", sub: "Essentials only" },
                        { id: "average", label: "AVERAGE", sub: "Standard consumer" },
                        { id: "frequent", label: "FREQUENT", sub: "High consumption" },
                      ] as const).map(s => (
                        <button key={s.id} onClick={() => set({ shoppingFrequency: s.id })}
                          className={`p-3 border rounded-xl text-center transition-all ${data.shoppingFrequency === s.id ? "bg-brand-blue/10 border-brand-blue text-white" : "bg-brand-black border-brand-border text-[#888888] hover:text-white hover:bg-brand-border"}`}>
                          <span className="block text-[10px] font-mono font-bold tracking-widest">{s.label}</span>
                          <span className="block text-[9px] font-mono text-[#888888] mt-0.5">{s.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Clothing Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "none", label: "NONE", sub: "+0.0t CO2" },
                        { id: "sustainable", label: "SUSTAINABLE", sub: "+0.2t CO2" },
                        { id: "fast-fashion", label: "FAST FASHION", sub: "+0.8t CO2" },
                      ] as const).map(ct => (
                        <button key={ct.id} onClick={() => set({ clothingType: ct.id })}
                          className={`p-3 border rounded-xl text-center transition-all ${data.clothingType === ct.id ? "bg-brand-blue/10 border-brand-blue text-white" : "bg-brand-black border-brand-border text-[#888888] hover:text-white hover:bg-brand-border"}`}>
                          <span className="block text-[10px] font-mono font-bold tracking-widest">{ct.label}</span>
                          <span className="block text-[9px] font-mono text-[#888888] mt-0.5">{ct.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">New Electronics / Yr</label>
                      <input type="number" min="0" max="20" value={data.newElectronics}
                        onChange={e => set({ newElectronics: Number(e.target.value) })}
                        className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-3 outline-none focus:border-brand-blue" />
                      <p className="text-[9px] font-mono text-[#888888]">~0.3t CO2 per device</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Recycling %</label>
                        <span className="text-sm font-mono font-bold text-brand-blue">{data.recycledPercent}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="5" value={data.recycledPercent}
                        onChange={e => set({ recycledPercent: Number(e.target.value) })}
                        className="w-full h-1 bg-brand-black rounded-lg cursor-pointer mt-3" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="space-y-2 pt-4 border-t border-[#1f2023]">
              {validationError && (
                <p className="text-[10px] font-mono text-red-400 font-bold tracking-wide text-center">
                  ⚠ {validationError}
                </p>
              )}
              <div className="flex justify-between items-center">
                <button onClick={() => { setValidationError(""); setStep(s => s - 1); }}
                  className="flex items-center gap-2 px-4 py-2.5 border border-brand-border text-[#888888] font-mono text-[10px] font-bold tracking-widest rounded-[10px] hover:bg-brand-border hover:text-white transition-all uppercase">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  BACK
                </button>
                <button onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-brand-black font-mono text-[10px] font-extrabold tracking-widest rounded-[10px] hover:brightness-110 active:scale-95 transition-all uppercase shadow-[0_4px_15px_rgba(0,242,255,0.2)]">
                  {step === 5 ? "COMPUTE BASELINE" : "NEXT"}
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 6: Summary ──────────────────────────────── */}
        {step === 6 && (
          <div className="bg-[#101112]/95 border border-[#1f2023] rounded-3xl p-8 space-y-6 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-brand-green/10 border border-brand-green/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-brand-green" />
              </div>
              <h2 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Baseline Computed</h2>
              <p className="text-xs text-[#888888]">Your carbon footprint profile has been calculated, Commander.</p>
            </div>

            {/* Baseline result */}
            <div className="bg-brand-black border rounded-2xl p-6 text-center space-y-1" style={{ borderColor: baselineColor + "40" }}>
              <p className="text-[10px] font-mono font-bold text-[#888888] tracking-widest uppercase">Estimated Annual Baseline</p>
              <div className="text-5xl font-mono font-extrabold" style={{ color: baselineColor }}>{est.total}t</div>
              <p className="text-xs font-mono font-bold tracking-widest" style={{ color: baselineColor }}>CO2e / YEAR · {baselineLabel}</p>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-2.5">
              {[
                { label: "TRANSPORT", val: est.transport, color: "#00f2ff" },
                { label: "ENERGY", val: est.energy, color: "#ffcc00" },
                { label: "FOOD & WASTE", val: est.food + est.waste, color: "#00ff66" },
                { label: "SHOPPING", val: est.shopping, color: "#ff6b6b" },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold">
                    <span className="text-[#888888]">{item.label}</span>
                    <span style={{ color: item.color }}>{item.val.toFixed(2)}t</span>
                  </div>
                  <div className="h-1 bg-brand-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (item.val / (est.total || 1)) * 100)}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Profile summary row */}
            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
              <div className="p-3 bg-brand-black border border-brand-border rounded-xl">
                <span className="text-[#888888] tracking-wider block font-bold uppercase">Commander</span>
                <span className="text-white font-bold tracking-wider uppercase">{data.name || "UNKNOWN"}</span>
              </div>
              <div className="p-3 bg-brand-black border border-brand-border rounded-xl">
                <span className="text-[#888888] tracking-wider block font-bold uppercase">Sector</span>
                <span className="text-white font-bold tracking-wider uppercase">{data.city ? `${data.city}, ${data.country}` : data.country}</span>
              </div>
            </div>

            <div className="p-3 bg-brand-blue/5 border border-brand-blue/10 rounded-xl text-[11px] text-[#888888] font-mono leading-relaxed">
              Mission Score starts at <span className="text-brand-blue font-bold">50</span>. Reduce emissions below this baseline to climb the ranks. Join challenges for bonus points.
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#1f2023]">
              <button onClick={() => setStep(5)}
                className="px-4 py-2.5 border border-brand-border text-[#888888] font-mono text-[10px] font-bold tracking-widest rounded-[10px] hover:bg-brand-border hover:text-white transition-all uppercase flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                BACK
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-brand-green text-brand-black font-mono font-extrabold text-sm tracking-widest rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,255,102,0.25)] uppercase disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">INITIALIZING MISSION...</span>
                ) : (
                  <><Rocket className="w-4 h-4" /> ENGAGE MISSION</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
