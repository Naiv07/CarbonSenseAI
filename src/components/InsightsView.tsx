import React from "react";
import { SimulationState, EmissionsBreakdown, Achievement, EmissionSnapshot } from "../types";
import { Award, Zap, Compass, Leaf, ArrowRight, ClipboardList, RefreshCw, Sun, Plane, Wifi } from "lucide-react";
import { useToast } from "../context/ToastContext";

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  recycle: <RefreshCw className="w-4 h-4" />,
  sun: <Sun className="w-4 h-4" />,
  leaf: <Leaf className="w-4 h-4" />,
  plane: <Plane className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  wifi: <Wifi className="w-4 h-4" />,
};

interface InsightsViewProps {
  simulation: SimulationState;
  breakdown: EmissionsBreakdown;
  achievements?: Achievement[];
  emissionHistory?: EmissionSnapshot[];
  baselineEmissions?: number;
  dataReady?: boolean;
  onUpdateSimulation: (updated: Partial<SimulationState>) => void;
  onDeployPlan: () => void;
}

export default function InsightsView({
  simulation,
  breakdown,
  achievements = [],
  emissionHistory = [],
  baselineEmissions,
  dataReady = false,
  onUpdateSimulation,
  onDeployPlan,
}: InsightsViewProps) {
  const { addToast } = useToast();

  // Compute simulated savings metrics dynamically
  let baseline = (baselineEmissions && baselineEmissions > 0) ? baselineEmissions : breakdown.total + 1.2;
  let currentSim = breakdown.total;
  let savingsPercent = Math.max(0, Math.round(((baseline - currentSim) / baseline) * 100));

  const handleExportCSV = () => {
    const rows = [
      "CARBONSENSEAI_MISSION_EXPORT",
      `Generated: ${new Date().toISOString()}`,
      "",
      "=== EMISSION BREAKDOWN ===",
      "category,mt_co2e",
      `transport,${breakdown.transport}`,
      `energy,${breakdown.energy}`,
      `food,${breakdown.food}`,
      `waste,${breakdown.waste}`,
      `shopping,${breakdown.shopping}`,
      `total,${breakdown.total}`,
      "",
      "=== EMISSION HISTORY ===",
      "label,total_mt_co2e,timestamp_unix",
      ...emissionHistory.map(s => `${s.label},${s.total},${s.timestamp}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbonsense_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Data exported successfully.", "SUCCESS");
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-baseline gap-4">
        <h2 className="text-xl font-display font-extrabold text-brand-blue uppercase tracking-wide">
          Insights
        </h2>
        <span className="text-[10px] font-mono bg-brand-green/10 border border-brand-green/20 text-brand-green px-2 py-0.5 rounded tracking-widest font-bold">
          v2.4
        </span>
      </div>
      <p className="text-xs text-[#888888] -mt-4">
        Real-time telemetry analytics of planetary carbon reduction matrices and strategic forecasting progress.
      </p>

      {/* Top row: Emission Breakdown chart and Badges Patches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Emission Breakdown Concentric Rings Tile */}
        <section className="lg:col-span-7 bento-card relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[9px] font-mono tracking-widest text-[#888888] font-bold">Emissions Breakdown</p>
              <h3 className="text-base font-display font-bold text-white uppercase tracking-tight">
                Your Data
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 text-brand-green font-mono text-[10px] tracking-widest font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse glow-secondary"></span>
              <span>Live</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Custom concentric ring visualizer representation */}
            <div className="relative aspect-square max-w-[200px] mx-auto flex items-center justify-center">
              <div className="w-full h-full border-4 border-brand-border rounded-full flex items-center justify-center relative">
                {/* Simulated colorful conic blur */}
                <div className="absolute inset-2 bg-linear-to-tr from-brand-blue via-brand-green to-brand-orange opacity-10 rounded-full blur-md"></div>
                
                <div className="w-32 h-32 border-2 border-brand-border rounded-full flex flex-col items-center justify-center bg-brand-black relative z-10">
                  <span className="text-2xl font-mono font-bold text-brand-blue">
                    {breakdown.total}t
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-[#888888] font-bold uppercase mt-0.5">
                    CO2e / YR
                  </span>
                </div>
              </div>
            </div>

            {/* Percentages bar gauges representing exact calculation */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-[#888888]">TRANSPORT EMISSIONS</span>
                  <span className="text-brand-blue">{Math.round((breakdown.transport / (breakdown.total || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-brand-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-blue" style={{ width: `${Math.round((breakdown.transport / (breakdown.total || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-[#888888]">DIET & WASTE</span>
                  <span className="text-brand-green">{Math.round(((breakdown.food + breakdown.waste) / (breakdown.total || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-brand-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green" style={{ width: `${Math.round(((breakdown.food + breakdown.waste) / (breakdown.total || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-[#888888]">ENERGY GRID FRACTION</span>
                  <span className="text-brand-orange">{Math.round((breakdown.energy / (breakdown.total || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-brand-black rounded-full overflow-hidden">
                  <div className="h-full bg-brand-orange" style={{ width: `${Math.round((breakdown.energy / (breakdown.total || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono font-bold">
                  <span className="text-[#888888]">SHOPPING & CONSUMER</span>
                  <span className="text-[#ff6b6b]">{Math.round(((breakdown.shopping ?? 0) / (breakdown.total || 1)) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-brand-black rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6b6b]" style={{ width: `${Math.round(((breakdown.shopping ?? 0) / (breakdown.total || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border flex">
                <button 
                  onClick={handleExportCSV}
                  className="text-[10px] font-mono font-bold tracking-widest text-brand-blue hover:underline flex items-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic achievements badges */}
        <section className="lg:col-span-5 bento-card flex flex-col">
          <div className="mb-4">
            <p className="text-[9px] font-mono tracking-widest text-[#888888] font-bold">Your Badges</p>
            <h3 className="text-base font-display font-bold text-white uppercase tracking-tight">
              Achievements
            </h3>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              {!dataReady ? (
                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-brand-blue/40 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#888888] italic">
                  No achievements yet. Reduce emissions and join missions to unlock badges.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Unlocked count header */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-brand-black/80 border border-brand-border rounded-2xl">
                <div className="w-10 h-10 rounded-full border-2 border-brand-green flex items-center justify-center bg-brand-green/10 glow-secondary shrink-0">
                  <Award className="text-brand-green w-5 h-5 stroke-[2]" />
                </div>
                <div className="font-mono">
                  <h4 className="text-xs font-bold text-white tracking-wider leading-none uppercase">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked
                  </h4>
                  <p className="text-[9px] text-[#888888] tracking-wider mt-1 uppercase font-bold">
                    Your progress
                  </p>
                </div>
              </div>

              {/* Badge grid from real achievements */}
              <div className="grid grid-cols-3 gap-2.5 flex-1">
                {achievements.map(badge => (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className={`flex flex-col items-center p-2.5 rounded-[14px] border transition-all ${
                      badge.unlocked
                        ? "border-brand-green/30 bg-brand-green/5 hover:border-brand-green/60 cursor-default"
                        : "border-brand-border bg-brand-black/50 opacity-35 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-9 h-9 mb-1.5 rounded flex items-center justify-center ${
                      badge.unlocked ? "bg-brand-green/20 text-brand-green" : "bg-brand-border text-[#555555]"
                    }`}>
                      {ACHIEVEMENT_ICONS[badge.icon] ?? <Award className="w-4 h-4" />}
                    </div>
                    <span className="text-[7.5px] font-mono font-bold text-center tracking-wider uppercase leading-tight text-[#888888]">
                      {badge.title.replace(/_/g, " ")}
                    </span>
                    {badge.unlocked && (
                      <span className="text-[7px] font-mono text-brand-green font-bold tracking-wider mt-0.5">ACTIVE</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Interactive Mitigation Matrix (Impact Forecaster) */}
      <section className="bento-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-brand-border pb-5">
          <div>
            <p className="text-[9px] font-mono tracking-widest text-[#888888] font-bold uppercase">
              Impact Simulator
            </p>
            <h3 className="text-base font-display font-bold text-white uppercase tracking-tight">
              What-If Scenarios
            </h3>
          </div>

          <div className="bg-brand-black p-2 border border-brand-border rounded-2xl flex gap-4 font-mono">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#888888] tracking-widest uppercase">Current</span>
              <span className="text-[13px] font-bold text-brand-blue">
                {baseline.toFixed(1)}t / CO2
              </span>
            </div>
            
            <div className="w-px h-8 bg-brand-border self-center"></div>
            
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#888888] tracking-widest uppercase">Simulated</span>
              <span className={`text-[13px] font-bold ${currentSim < baseline ? "text-brand-green" : "text-brand-blue"}`}>
                {currentSim.toFixed(1)}t / CO2
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* Card Control 1 */}
          <div className="p-4 bg-brand-black border border-brand-border rounded-[20px] hover:border-brand-blue transition-colors flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Leaf className="w-5 h-5 text-brand-green" />
                <input
                  type="checkbox"
                  checked={simulation.plantBased}
                  onChange={(e) => onUpdateSimulation({ plantBased: e.target.checked })}
                  className="rounded border-brand-border bg-brand-black text-brand-blue h-4 w-4 focus:ring-0 cursor-pointer"
                />
              </div>
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
                Plant-Based Diet
              </h4>
              <p className="text-xs text-[#888888] mt-1 font-mono">
                Reduce meat consumption by 80% each week.
              </p>
            </div>
            <div className="mt-4 text-[11px] font-mono font-bold text-brand-green tracking-wider">
              -1.8t / CO2 YR
            </div>
          </div>

          {/* Card Control 2 */}
          <div className="p-4 bg-brand-black border border-brand-border rounded-[20px] hover:border-brand-blue transition-colors flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Zap className="w-5 h-5 text-brand-orange" />
                <input
                  type="checkbox"
                  checked={simulation.solarConversion}
                  onChange={(e) => onUpdateSimulation({ solarConversion: e.target.checked })}
                  className="rounded border-brand-border bg-brand-black text-brand-blue h-4 w-4 focus:ring-0 cursor-pointer"
                />
              </div>
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
                Solar Panels
              </h4>
              <p className="text-xs text-[#888888] mt-1 font-mono">
                Install a 5kW solar system at home.
              </p>
            </div>
            <div className="mt-4 text-[11px] font-mono font-bold text-brand-green tracking-wider">
              -3.2t / CO2 YR
            </div>
          </div>

          {/* Card Control 3 */}
          <div className="p-4 bg-brand-black border border-brand-border rounded-[20px] hover:border-brand-blue transition-colors flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Compass className="w-5 h-5 text-brand-blue" />
                <input
                  type="checkbox"
                  checked={simulation.evMobility}
                  onChange={(e) => onUpdateSimulation({ evMobility: e.target.checked })}
                  className="rounded border-brand-border bg-brand-black text-brand-blue h-4 w-4 focus:ring-0 cursor-pointer"
                />
              </div>
              <h4 className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
                Electric Vehicle
              </h4>
              <p className="text-xs text-[#888888] mt-1 font-mono">
                Switch to a zero-emission electric car.
              </p>
            </div>
            <div className="mt-4 text-[11px] font-mono font-bold text-brand-green tracking-wider">
              -2.4t / CO2 YR
            </div>
          </div>

          {/* Sum Projection success tile card */}
          <div className="p-5 bg-brand-blue/5 border border-brand-blue/20 rounded-[20px] flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-mono font-bold text-brand-blue tracking-widest block uppercase">
                Projected Reduction
              </span>
              <div className="text-lg font-display font-extrabold text-white mt-1 uppercase tracking-tight">
                {savingsPercent}% REDUCTION
              </div>
            </div>
            
            <button
              onClick={onDeployPlan}
              className="w-full mt-4 py-2.5 bg-linear-to-r from-brand-blue to-[#0066ff] hover:opacity-90 active:scale-95 text-brand-black text-[10px] font-mono font-extrabold tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_15px_rgba(0,242,255,0.2)]"
            >
              <span>Apply This Plan</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}
