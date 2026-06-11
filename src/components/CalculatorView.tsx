import React, { useState } from "react";
import { TelemetryState, EmissionsBreakdown } from "../types";
import { Car, Lightbulb, Utensils, Trash2, ShoppingBag, RefreshCw, Info, Check } from "lucide-react";

interface CalculatorViewProps {
  telemetry: TelemetryState;
  breakdown: EmissionsBreakdown;
  currencySymbol?: string;
  onUpdateTelemetry: (updated: Partial<TelemetryState>) => void;
  onExecuteSync: () => Promise<void>;
}

type Category = "TRANSPORT" | "ENERGY" | "FOOD" | "WASTE" | "SHOPPING";

export default function CalculatorView({
  telemetry,
  breakdown,
  currencySymbol = "$",
  onUpdateTelemetry,
  onExecuteSync,
}: CalculatorViewProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("TRANSPORT");
  const [syncStatus, setSyncStatus] = useState<"STABLE" | "SYNCING" | "SYNCED">("STABLE");

  const categories: { id: Category; label: string; icon: React.ElementType }[] = [
    { id: "TRANSPORT", label: "TRANSPORT", icon: Car },
    { id: "ENERGY", label: "ENERGY", icon: Lightbulb },
    { id: "FOOD", label: "FOOD", icon: Utensils },
    { id: "WASTE", label: "WASTE", icon: Trash2 },
    { id: "SHOPPING", label: "SHOPPING", icon: ShoppingBag },
  ];

  const triggerLocalSync = async () => {
    setSyncStatus("SYNCING");
    try {
      await onExecuteSync();
      setSyncStatus("SYNCED");
      setTimeout(() => setSyncStatus("STABLE"), 2500);
    } catch {
      setSyncStatus("STABLE");
    }
  };

  const mileageIsHigh = telemetry.mileage > 30000;

  const maxCap = 12.0;
  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(breakdown.total, maxCap) / maxCap) * circ;

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* Left Input Telemetry Block */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-[0.2em] text-brand-blue font-bold">Carbon Calculator</p>
            <h1 className="text-2xl font-display font-extrabold text-white uppercase tracking-tight">Your Data</h1>
          </div>
          <div className="text-right font-mono">
            <p className="text-[9px] font-bold text-[#888888] tracking-widest">Sync Status</p>
            <div className="flex items-center gap-2 justify-end mt-0.5">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse glow-secondary"></span>
              <span className="text-[10px] text-brand-green font-bold tracking-widest">Live</span>
            </div>
          </div>
        </div>

        {/* Phase progress line */}
        <div className="bg-brand-dark border border-brand-border p-4 flex gap-2 rounded-2xl">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < categories.findIndex(c => c.id === activeCategory)
                  ? "bg-brand-green"
                  : i === categories.findIndex(c => c.id === activeCategory)
                  ? "bg-brand-blue animate-pulse"
                  : "bg-brand-border"
              }`}
            />
          ))}
        </div>

        {/* Category Tab Grid */}
        <div role="tablist" aria-label="Emission categories" className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSel = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isSel}
                aria-controls={`panel-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-3 flex flex-col items-center gap-2 border transition-all text-center rounded-[20px] ${
                  isSel
                    ? "bg-brand-blue/10 border-2 border-brand-blue text-brand-blue shadow-[0_0_15px_rgba(0,242,255,0.1)]"
                    : "bg-brand-dark border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isSel ? "text-brand-blue" : "text-[#888888]"}`} aria-hidden="true" />
                <span className="text-[9px] font-mono tracking-widest font-bold">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Panels */}
        <div className="bento-card relative min-h-[320px] flex flex-col justify-between">
          <div className="absolute top-3 right-3 text-[9px] font-mono text-[#888888]/35"></div>

          <div>
            {/* TRANSPORT */}
            {activeCategory === "TRANSPORT" && (
              <div id="panel-TRANSPORT" role="tabpanel" aria-label="Transport emissions" className="space-y-6 animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">Annual Mileage</label>
                      <p className="text-xs text-[#888888] mt-0.5">Total distance traveled by vehicle per year</p>
                    </div>
                    <span className={`text-xl font-mono font-bold ${mileageIsHigh ? "text-red-400" : "text-brand-blue"}`}>
                      {telemetry.mileage.toLocaleString()} <span className="text-xs">KM</span>
                    </span>
                  </div>
                  <input type="range" min="1000" max="60000" step="500" value={telemetry.mileage}
                    aria-label="Annual mileage"
                    onChange={(e) => onUpdateTelemetry({ mileage: Number(e.target.value) })}
                    className="w-full h-1 bg-brand-black rounded-lg cursor-pointer" />
                  {mileageIsHigh && (
                    <p className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                      ⚠ High mileage — consider reducing driving.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Commute Frequency</label>
                    <div className="bg-brand-black border border-brand-border p-1.5 flex rounded-xl">
                      {(["DAILY", "WEEKLY", "REMOTE"] as const).map((freq) => (
                        <button key={freq} onClick={() => onUpdateTelemetry({ commuteFrequency: freq })}
                          className={`flex-1 py-1.5 text-[9px] font-mono font-bold tracking-wider rounded-[8px] uppercase transition-colors ${
                            telemetry.commuteFrequency === freq ? "bg-brand-blue text-brand-black font-extrabold" : "text-[#888888] hover:text-white"
                          }`}>
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Vehicle Type</label>
                    <select value={telemetry.vehicleType} onChange={(e) => onUpdateTelemetry({ vehicleType: e.target.value })}
                      className="w-full bg-brand-black border border-brand-border rounded-xl text-xs font-mono font-bold tracking-wider text-white p-2.5 outline-none focus:border-brand-blue">
                      <option value="INTERNAL_COMBUSTION_MEDIUM">COMBUSTION_MEDIUM</option>
                      <option value="INTERNAL_COMBUSTION_LARGE">COMBUSTION_LARGE</option>
                      <option value="HYBRID_PLUG_IN">HYBRID_PLUG_IN</option>
                      <option value="ELECTRIC_BEV">ELECTRIC_BEV (ZERO EMISSION)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-border/60">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">
                      Short-Haul Flights / Year
                    </label>
                    <input type="number" min="0" max="50" value={telemetry.flightsShortHaul}
                      onChange={(e) => onUpdateTelemetry({ flightsShortHaul: Number(e.target.value) })}
                      className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-2.5 outline-none focus:border-brand-blue"
                      placeholder="0" />
                    <p className="text-[9px] font-mono text-[#888888]">~0.18t CO2 per flight</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">
                      Long-Haul Flights / Year
                    </label>
                    <input type="number" min="0" max="20" value={telemetry.flightsLongHaul}
                      onChange={(e) => onUpdateTelemetry({ flightsLongHaul: Number(e.target.value) })}
                      className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-2.5 outline-none focus:border-brand-blue"
                      placeholder="0" />
                    <p className="text-[9px] font-mono text-[#888888]">~1.56t CO2 per flight</p>
                  </div>
                </div>
              </div>
            )}

            {/* ENERGY */}
            {activeCategory === "ENERGY" && (
              <div id="panel-ENERGY" role="tabpanel" aria-label="Energy emissions" className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Monthly Energy Bill</label>
                  <p className="text-xs text-[#888888]">Average monthly electricity cost ({currencySymbol}/month)</p>
                </div>
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-[#888888] text-xl font-mono">{currencySymbol}</span>
                  </div>
                  <input type="number" min="0" max="1200" value={telemetry.utilityBill}
                    onChange={(e) => onUpdateTelemetry({ utilityBill: Number(e.target.value) })}
                    className="w-full bg-brand-black border border-brand-border rounded-2xl py-4 pl-10 pr-4 text-2xl font-mono text-white tracking-widest focus:border-2 focus:border-brand-blue focus:outline-none"
                    placeholder="Enter utility bill" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Energy Source</label>
                    <div className="space-y-2">
                      {([
                        { id: "renewable", label: "RENEWABLE", desc: "Solar / Wind / Hydro — 70% factor reduction" },
                        { id: "mixed", label: "MIXED GRID", desc: "Standard regional mix" },
                        { id: "fossil", label: "FOSSIL FUEL", desc: "Coal / Gas — 40% factor increase" },
                      ] as const).map((src) => (
                        <button key={src.id} onClick={() => onUpdateTelemetry({ energySource: src.id })}
                          className={`w-full p-3 border text-left rounded-xl transition-all ${
                            telemetry.energySource === src.id
                              ? "bg-brand-blue/10 border-brand-blue text-white"
                              : "bg-brand-black border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                          }`}>
                          <span className="block text-[10px] font-mono font-bold tracking-widest">{src.label}</span>
                          <p className="text-[9px] text-[#888888] mt-0.5 font-mono">{src.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Heating Type</label>
                    <div className="space-y-2">
                      {([
                        { id: "none", label: "NONE", desc: "+0.0t CO2/yr" },
                        { id: "heatpump", label: "HEAT PUMP", desc: "+0.2t CO2/yr" },
                        { id: "electric", label: "ELECTRIC", desc: "+0.4t CO2/yr" },
                        { id: "gas", label: "NATURAL GAS", desc: "+0.8t CO2/yr" },
                        { id: "oil", label: "OIL / DIESEL", desc: "+1.2t CO2/yr" },
                      ] as const).map((ht) => (
                        <button key={ht.id} onClick={() => onUpdateTelemetry({ heatingType: ht.id })}
                          className={`w-full p-2.5 border text-left rounded-xl transition-all flex justify-between items-center ${
                            telemetry.heatingType === ht.id
                              ? "bg-brand-blue/10 border-brand-blue text-white"
                              : "bg-brand-black border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                          }`}>
                          <span className="text-[10px] font-mono font-bold tracking-widest">{ht.label}</span>
                          <span className="text-[9px] font-mono text-[#888888]">{ht.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOOD */}
            {activeCategory === "FOOD" && (
              <div id="panel-FOOD" role="tabpanel" aria-label="Food emissions" className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Meat Consumption</label>
                  <p className="text-xs text-[#888888]">Your diet has a significant impact on your carbon footprint</p>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-xl">
                  {[
                    { id: "DAILY", label: "DAILY MEAT", desc: "Standard protein ratios" },
                    { id: "WEEKLY", label: "WEEKLY MEAT", desc: "Mitigation factor medium" },
                    { id: "VEGETARIAN", label: "VEGETARIAN", desc: "No meat. Low index footprint." },
                    { id: "VEGAN", label: "VEGAN", desc: "Fully plant-based. Lowest footprint." },
                  ].map((diet) => (
                    <button key={diet.id} onClick={() => onUpdateTelemetry({ meatIntake: diet.id })}
                      className={`p-4 border text-left rounded-2xl transition-all duration-200 ${
                        telemetry.meatIntake === diet.id
                          ? "bg-brand-blue/10 border-brand-blue text-white"
                          : "bg-brand-black border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                      }`}>
                      <span className="block text-xs font-mono font-bold tracking-widest">{diet.label}</span>
                      <p className="text-[10px] text-[#888888] mt-1 font-mono">{diet.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-brand-border/60 space-y-3">
                  <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Food Waste Level</label>
                  <div className="flex gap-3">
                    {([
                      { id: "low", label: "LOW WASTE", desc: "Meal plan / minimal scraps — 0.8x multiplier" },
                      { id: "medium", label: "MEDIUM WASTE", desc: "Average household — 1.0x multiplier" },
                      { id: "high", label: "HIGH WASTE", desc: "Frequent disposal — 1.3x multiplier" },
                    ] as const).map((fw) => (
                      <button key={fw.id} onClick={() => onUpdateTelemetry({ foodWaste: fw.id })}
                        className={`flex-1 p-3 border text-left rounded-xl transition-all ${
                          telemetry.foodWaste === fw.id
                            ? "bg-brand-green/10 border-brand-green text-white"
                            : "bg-brand-black border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                        }`}>
                        <span className="block text-[9px] font-mono font-bold tracking-widest">{fw.label}</span>
                        <p className="text-[9px] text-[#888888] mt-1 font-mono leading-tight">{fw.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* WASTE */}
            {activeCategory === "WASTE" && (
              <div id="panel-WASTE" role="tabpanel" aria-label="Waste emissions" className="space-y-6 animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Recycling Rate</label>
                      <p className="text-xs text-[#888888] mt-0.5">Percentage of your waste that gets recycled</p>
                    </div>
                    <span className="text-xl font-mono text-brand-blue font-bold">{telemetry.recycledPercent}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={telemetry.recycledPercent}
                    aria-label="Recycled waste percentage"
                    onChange={(e) => onUpdateTelemetry({ recycledPercent: Number(e.target.value) })}
                    className="w-full h-1 bg-brand-black rounded-lg cursor-pointer" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-[#888888] font-bold">
                  <span className={telemetry.recycledPercent < 30 ? "text-brand-orange" : ""}>NONE (0-30%)</span>
                  <span className={telemetry.recycledPercent >= 30 && telemetry.recycledPercent < 75 ? "text-brand-blue" : ""}>PARTIAL (30-75%)</span>
                  <span className={telemetry.recycledPercent >= 75 ? "text-brand-green" : ""}>OPTIMIZED (75%+)</span>
                </div>
              </div>
            )}

            {/* SHOPPING */}
            {activeCategory === "SHOPPING" && (
              <div id="panel-SHOPPING" role="tabpanel" aria-label="Shopping emissions" className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Shopping Frequency</label>
                  <p className="text-xs text-[#888888]">How often do you buy non-essential items?</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "minimal", label: "MINIMAL", desc: "Essentials only — 0.2t CO2/yr" },
                    { id: "average", label: "AVERAGE", desc: "Standard consumer — 0.5t CO2/yr" },
                    { id: "frequent", label: "FREQUENT", desc: "High consumption — 1.2t CO2/yr" },
                  ] as const).map((sf) => (
                    <button key={sf.id} onClick={() => onUpdateTelemetry({ shoppingFrequency: sf.id })}
                      className={`p-4 border text-left rounded-2xl transition-all ${
                        telemetry.shoppingFrequency === sf.id
                          ? "bg-brand-blue/10 border-brand-blue text-white"
                          : "bg-brand-black border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                      }`}>
                      <span className="block text-xs font-mono font-bold tracking-widest">{sf.label}</span>
                      <p className="text-[9px] text-[#888888] mt-1 font-mono">{sf.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-border/60">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">
                      New Electronics / Year
                    </label>
                    <input type="number" min="0" max="20" value={telemetry.newElectronics}
                      onChange={(e) => onUpdateTelemetry({ newElectronics: Number(e.target.value) })}
                      className="w-full bg-brand-black border border-brand-border rounded-xl text-sm font-mono text-white p-2.5 outline-none focus:border-brand-blue"
                      placeholder="0" />
                    <p className="text-[9px] font-mono text-[#888888]">~0.3t CO2 per device (phones, laptops, etc.)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono tracking-widest text-[#888888] font-bold uppercase">Clothing Type</label>
                    <div className="space-y-2">
                      {([
                        { id: "none", label: "NO NEW CLOTHING", desc: "+0.0t CO2/yr" },
                        { id: "sustainable", label: "SUSTAINABLE", desc: "+0.2t CO2/yr" },
                        { id: "fast-fashion", label: "FAST FASHION", desc: "+0.8t CO2/yr" },
                      ] as const).map((ct) => (
                        <button key={ct.id} onClick={() => onUpdateTelemetry({ clothingType: ct.id })}
                          className={`w-full p-2.5 border text-left rounded-xl transition-all flex justify-between items-center ${
                            telemetry.clothingType === ct.id
                              ? "bg-brand-blue/10 border-brand-blue text-white"
                              : "bg-brand-black border-brand-border text-[#888888] hover:bg-brand-border hover:text-white"
                          }`}>
                          <span className="text-[10px] font-mono font-bold tracking-widest">{ct.label}</span>
                          <span className="text-[9px] font-mono text-[#888888]">{ct.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sync Button */}
          <div className="flex justify-end pt-6 border-t border-brand-border/60 mt-4">
            <button onClick={triggerLocalSync} disabled={syncStatus !== "STABLE"}
              className="px-6 py-3 bg-brand-blue hover:brightness-110 active:scale-95 text-brand-black font-mono text-xs font-extrabold tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(0,242,255,0.2)]">
              {syncStatus === "SYNCING" ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /><span>Syncing...</span></>
              ) : syncStatus === "SYNCED" ? (
                <><Check className="w-4 h-4 text-green-700 stroke-[3]" /><span>Synced ✓</span></>
              ) : (
                <><RefreshCw className="w-4 h-4" /><span>Sync to Dashboard</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Circular Impact Monitor */}
      <div className="w-full lg:w-72 xl:w-80 shrink-0">
        <div className="bento-card space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-mono tracking-wider text-brand-green font-bold uppercase">Live Impact</p>
            <span className="w-2.5 h-2.5 bg-brand-green/30 border border-brand-green/60 rounded-full flex items-center justify-center animate-pulse">
              <span className="w-1.5 h-1.5 bg-brand-green rounded-full"></span>
            </span>
          </div>

          {/* SVG Circular Gauge */}
          <div className="relative flex justify-center py-2 sm:py-4">
            <svg viewBox="0 0 176 176" className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 transform -rotate-90">
              <circle cx="88" cy="88" r="80" fill="transparent" stroke="#222222" strokeWidth="6" />
              <circle cx="88" cy="88" r="80" fill="transparent" stroke="#00ff66" strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-300" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-white tracking-widest">{breakdown.total}</span>
              <span className="text-[10px] font-mono tracking-wider text-[#888888] font-bold mt-1">TONNES CO2e</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-brand-border/60">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold">
              <span className="text-[#888888] tracking-wider">Regional Target</span>
              <span className="text-white">5.1t</span>
            </div>
            <div className="h-1 bg-brand-black rounded overflow-hidden">
              <div className={`h-full ${breakdown.total > 5.1 ? "bg-red-400" : "bg-brand-green"}`}
                style={{ width: `${Math.min(100, (breakdown.total / 10) * 100)}%` }}></div>
            </div>
            <p className={`text-xs text-center font-mono font-bold block ${breakdown.total <= 5.1 ? "text-brand-green" : "text-red-400 animate-pulse"}`}>
              {breakdown.total <= 5.1
                ? `✓ ${Math.round((1 - breakdown.total / 5.1) * 100)}% below regional target`
                : `⚠ ${Math.round((breakdown.total / 5.1 - 1) * 100)}% above regional target`}
            </p>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-brand-border/60 text-[10px] font-mono font-bold">
            <p className="text-[#888888] tracking-wider uppercase mb-1">Emissions Breakdown</p>
            {[
              { color: "bg-brand-blue", label: "TRANSPORT", val: breakdown.transport },
              { color: "bg-brand-orange", label: "ENERGY", val: breakdown.energy },
              { color: "bg-brand-green", label: "FOOD & WASTE", val: breakdown.food + breakdown.waste },
              { color: "bg-[#ff6b6b]", label: "SHOPPING", val: breakdown.shopping },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 ${item.color} rounded-sm`}></span>
                <span className="text-[#888888] flex-1">{item.label}</span>
                <span>{Math.round((item.val / (breakdown.total || 1)) * 100)}%</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-brand-orange/10 border-l-4 border-brand-orange flex gap-3 text-xs rounded-r">
            <Info className="w-5 h-5 text-brand-orange shrink-0" />
            <div>
              <p className="font-mono font-bold text-brand-orange tracking-wider text-[10px] uppercase">Tip</p>
              <p className="text-[#888888] mt-1 text-[11px] leading-relaxed">
                {mileageIsHigh
                  ? "Your mileage is very high. Consider switching to remote work or public transport to reduce emissions."
                  : "Small changes across all categories add up. Check each section to find your biggest opportunities."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
