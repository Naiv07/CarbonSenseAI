import React, { useState } from "react";
import { ActivityLog, Challenge, EmissionsBreakdown, CommanderState, EmissionSnapshot, Achievement } from "../types";
import { Cpu, ArrowUpRight, RefreshCw, Send, Sparkles } from "lucide-react";

interface DashboardViewProps {
  breakdown: EmissionsBreakdown;
  logs: ActivityLog[];
  challenges: Challenge[];
  commander: CommanderState;
  missionScore: number;
  rank: string;
  emissionHistory: EmissionSnapshot[];
  achievements: Achievement[];
  onDeployRecommendation: (actionType: string) => void;
  onDismissRecommendation: () => void;
  onRefreshCommander: (promptText?: string) => Promise<void>;
  onJoinChallenge: (id: string) => void;
}

export default function DashboardView({
  breakdown,
  logs,
  challenges,
  commander,
  missionScore,
  rank,
  emissionHistory,
  achievements,
  onDeployRecommendation,
  onDismissRecommendation,
  onRefreshCommander,
  onJoinChallenge,
}: DashboardViewProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // --- Trajectory chart helpers ---
  const MAX_EMISSION = 12;
  const CX = { left: 50, right: 970 };
  const CY = { top: 40, bottom: 360 };
  const toSvgX = (i: number, total: number) =>
    total <= 1 ? (CX.left + CX.right) / 2 : CX.left + (i / (total - 1)) * (CX.right - CX.left);
  const toSvgY = (val: number) => CY.bottom - (Math.min(val, MAX_EMISSION) / MAX_EMISSION) * (CY.bottom - CY.top);

  const buildPath = (hist: EmissionSnapshot[]) => {
    if (hist.length === 0) return "";
    if (hist.length === 1) return `M${toSvgX(0, 1)},${toSvgY(hist[0].total)}`;
    const pts = hist.map((p, i) => ({ x: toSvgX(i, hist.length), y: toSvgY(p.total) }));
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C${cpx.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${cpx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    return d;
  };

  const actualPath = buildPath(emissionHistory);
  const lastPt = emissionHistory.length > 0
    ? { x: toSvgX(emissionHistory.length - 1, emissionHistory.length), y: toSvgY(emissionHistory[emissionHistory.length - 1].total) }
    : { x: CX.right, y: CY.bottom - 100 };

  // Target line: Paris-aligned 2.5t goal (declining from 4.5 to 2.0)
  const targetStartY = toSvgY(4.5);
  const targetEndY = toSvgY(2.0);

  // Active missions: show joined first, then available to fill up to 3
  const joinedChallenges = challenges.filter(c => c.status === "JOINED" || c.status === "COMPLETED");
  const availableChallenges = challenges.filter(c => c.status === "AVAILABLE");
  const displayedMissions = [...joinedChallenges, ...availableChallenges].slice(0, 3);

  // Rank tier progress: each tier spans 10 points (score 0 = 0%, multiples of 10 = 100%)
  const tierProgress = missionScore > 0 && missionScore % 10 === 0 ? 100 : (missionScore % 10) * 10;

  // Real variance: % change between the two most recent emission snapshots
  const variancePct = (() => {
    if (emissionHistory.length < 2) return null;
    const prev = emissionHistory[emissionHistory.length - 2].total;
    const curr = emissionHistory[emissionHistory.length - 1].total;
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  })();
  const percentileLabel = missionScore >= 80 ? "TOP 5% CLIMATE" : missionScore >= 60 ? "TOP 15% CLIMATE" : missionScore >= 40 ? "TOP 30% CLIMATE" : "BELOW MEDIAN";

  const handleAISend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAI(true);
    try {
      await onRefreshCommander(customPrompt);
      setCustomPrompt("");
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Telemetry Overview & Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Footprint Indicator */}
        <div className="bento-card relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
              Your Carbon Footprint
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse glow-secondary" title="System online"></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono font-extrabold text-brand-green">
              {breakdown.total}
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
              t CO₂e / yr
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border flex justify-between text-[11px] font-mono">
            <span className="text-[#888888] tracking-wider">Change</span>
            {variancePct === null ? (
              <span className="text-[#555555] font-bold tracking-widest">No data yet</span>
            ) : (
              <span className={`flex items-center font-bold tracking-widest ${variancePct <= 0 ? "text-brand-green" : "text-red-400"}`}>
                {variancePct > 0 ? "+" : ""}{variancePct.toFixed(1)}%
                <ArrowUpRight className={`w-3.5 h-3.5 inline ml-0.5 ${variancePct <= 0 ? "rotate-180" : ""}`} />
              </span>
            )}
          </div>
        </div>

        {/*Score Indicator */}
        <div className="bento-card relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
              Your Climate Score
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse glow-primary" title="Sensor data synchronized"></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-mono font-extrabold text-brand-blue">
              {missionScore}
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
              / 100
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border flex justify-between text-[11px] font-mono">
            <span className="text-[#888888] tracking-wider">PERCENTILE</span>
            <span className="text-brand-green font-bold tracking-widest">{percentileLabel}</span>
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-mono">
            <span className="text-[#888888] tracking-wider">BADGES</span>
            <span className="text-brand-orange font-bold tracking-widest">
              {achievements.filter(a => a.unlocked).length} / {achievements.length || "—"}
            </span>
          </div>
        </div>

        {/* Identity & Rank Badge */}
        <div className="bento-card relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
              Your Rank
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse glow-warning" title="Commander active"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-display font-extrabold text-brand-orange uppercase tracking-wide">
              {rank.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono tracking-widest text-[#888888] uppercase font-bold mt-0.5">
              Score {missionScore}/100 · Tier Progress
            </span>
          </div>
          <div className="mt-3.5">
            <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div className="h-full bg-brand-orange transition-all duration-500" style={{ width: `${tierProgress}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] font-mono text-[#888888] mt-1 tracking-wider font-bold">
              <span>Tier Progress</span>
              <span>{tierProgress}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trajectory Chart and AI Commander Columns */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Emission Trajectory Chart */}
        <div className="lg:col-span-8 bento-card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest text-brand-blue uppercase">
                  Emissions Over Time
                </h3>
                <p className="text-xs text-[#888888] mt-0.5 font-medium">
                  Your emissions curve vs climate targets
                </p>
              </div>
              
              {/* Legends */}
              <div className="flex items-center gap-5">
                {/* Actual trajectory — solid line + pulse dot */}
                <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-brand-blue">
                  <span className="flex items-center gap-1">
                    <span className="w-5 h-px bg-brand-blue inline-block"></span>
                    <span className="w-2 h-2 rounded-full bg-brand-blue inline-block animate-pulse"></span>
                    <span className="w-5 h-px bg-brand-blue inline-block"></span>
                  </span>
                  <span>Your Emissions</span>
                </div>
                {/* Target line — dashed */}
                <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-brand-green">
                  <span className="flex items-center gap-0.5">
                    <span className="w-2.5 h-px bg-brand-green inline-block"></span>
                    <span className="w-1 h-px inline-block"></span>
                    <span className="w-2.5 h-px bg-brand-green inline-block"></span>
                    <span className="w-1 h-px inline-block"></span>
                    <span className="w-2.5 h-px bg-brand-green inline-block"></span>
                  </span>
                  <span>Paris Target</span>
                </div>
              </div>
            </div>

            {/* Real data trajectory SVG */}
            <div className="h-68 w-full border-l border-b border-brand-border relative flex items-end bg-brand-black/30 rounded-xl overflow-hidden">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1020 400" role="img" aria-label="Carbon emission trajectory chart showing your actual emissions versus the Paris Agreement target">
                {/* Horizontal grid lines + Y-axis labels */}
                {[3, 6, 9].map(val => {
                  const y = toSvgY(val);
                  return (
                    <g key={val}>
                      <line x1={CX.left} y1={y} x2={CX.right} y2={y} stroke="#222222" strokeWidth="1" strokeDasharray="4" />
                      <text x="14" y={y + 4} fill="#555555" fontSize="18" fontFamily="monospace">{val}t</text>
                    </g>
                  );
                })}

                {/* Target declining line (Paris-aligned 4.5→2.0 MT) */}
                <path
                  d={`M${CX.left},${targetStartY} L${CX.right},${targetEndY}`}
                  fill="none"
                  stroke="#00ff66"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                />

                {/* Actual emission curve from real history */}
                {actualPath && (
                  <path d={actualPath} fill="none" stroke="#00f2ff" strokeWidth="3.5" />
                )}

                {/* Live pulse dot at latest data point */}
                <circle cx={lastPt.x} cy={lastPt.y} r="6" fill="#00f2ff">
                  <animate attributeName="r" values="5;9;5" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </svg>

              {/* Live sweep overlay */}
              <div className="absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-transparent via-brand-blue/5 to-transparent map-sweep pointer-events-none"></div>

              <span className="absolute top-3 right-3 text-[9px] font-mono bg-red-950/40 border border-red-500/30 text-red-400 px-1.5 py-0.5 rounded tracking-widest font-bold">
                Live
              </span>
            </div>
          </div>

          {/* X-axis labels from history */}
          <div className="flex justify-between mt-3 text-[10px] font-mono text-[#888888] tracking-wider font-bold px-1">
            {emissionHistory.length > 0
              ? emissionHistory.filter((_, i) => i % Math.max(1, Math.floor(emissionHistory.length / 4)) === 0 || i === emissionHistory.length - 1).slice(0, 5).map((p, i) => (
                  <span key={i}>{p.label}</span>
                ))
              : <><span>Q1_START</span><span>Q2_INTERVAL</span><span>Q3_DEPLOY</span><span>NOW</span></>
            }
          </div>
        </div>

        {/* AI Commander Panel - Prompts Gemini directly! */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bento-card border-brand-blue relative shadow-[0_4px_25px_rgba(0,242,255,0.05)]">
            {/* Header pill */}
            <div className="absolute -top-3 left-4 bg-brand-blue text-brand-black px-2 py-0.5 text-[9px] font-mono font-extrabold flex items-center gap-1 glow-primary uppercase rounded">
              <Sparkles className="w-3 h-3 text-brand-black stroke-[2.5]" />
              AI Advisor
            </div>

            <div className="flex gap-4 items-start mt-2">
              <div className="shrink-0 h-10 w-10 bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20 rounded">
                <Cpu className="text-brand-blue w-5 h-5 animate-pulse" />
              </div>

              <div className="flex-1 space-y-3">
                {commander.status === "ACTIVE" ? (
                  <div className="space-y-4">
                    <p className="text-xs font-mono text-white leading-relaxed italic">
                      &quot;{commander.warning}&quot;
                    </p>

                    {/* Operational controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDeployRecommendation(commander.action)}
                        className="flex-1 bg-brand-blue/10 border border-brand-blue/30 text-brand-blue py-1.5 text-[9px] font-mono font-bold tracking-widest hover:bg-brand-blue/25 active:scale-95 transition-all text-center uppercase rounded-xl"
                      >
                        Apply
                      </button>
                      <button
                        onClick={onDismissRecommendation}
                        className="flex-1 border border-brand-border text-[#888888] py-1.5 text-[9px] font-mono font-bold tracking-widest hover:bg-brand-border transition-all text-center uppercase rounded-xl"
                      >
                        DISMISS
                      </button>
                    </div>
                  </div>
                ) : commander.status === "DEPLOYED" ? (
                  <div className="p-3 bg-brand-green/10 border border-brand-green/20 text-brand-green rounded text-xs text-center font-mono font-bold tracking-wide">
                    ✓ Action applied successfully.
                  </div>
                ) : (
                  <div className="text-xs text-[#888888] font-mono py-2 italic text-center">
                    Tip dismissed. Ask me anything about your footprint using the box below.
                  </div>
                )}
              </div>
            </div>

            {/* Gemini Prompt Bar directly underneath */}
            <form onSubmit={handleAISend} className="mt-4 pt-4 border-t border-brand-border/60 flex gap-1.5">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoadingAI}
                placeholder="Ask for advice (e.g. Help me save 2 tonnes...)"
                aria-label="Ask the AI advisor a question"
                className="flex-1 bg-brand-black border border-brand-border text-xs font-mono text-white px-3 py-2 rounded focus:outline-none focus:border-brand-blue placeholder-[#888888]"
              />
              <button
                type="submit"
                disabled={isLoadingAI || !customPrompt.trim()}
                className="bg-brand-blue hover:brightness-110 active:scale-95 text-brand-black p-2 rounded transition-all flex items-center justify-center cursor-pointer"
                title="Send instruction order to Gemini AI model"
                aria-label="Send message to AI advisor"
              >
                {isLoadingAI ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>

          {/* Active Challenges Module — wired to real challenges */}
          <div className="bento-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
                Active Challenges
              </h3>
              <span className="text-[10px] font-mono tracking-widest text-brand-green font-bold bg-brand-green/15 border border-brand-green/20 px-1.5 rounded animate-pulse">
                {joinedChallenges.length} Active
              </span>
            </div>

            <div className="space-y-4">
              {displayedMissions.length === 0 ? (
                <p className="text-[10px] font-mono text-[#888888] italic text-center py-2">
                  No challenges active. Join some in Challenges.
                </p>
              ) : displayedMissions.map((c) => {
                const isJoined = c.status === "JOINED";
                const isCompleted = c.status === "COMPLETED";
                const barColor = isCompleted ? "#00ff66" : "#00f2ff";
                const barWidth = isCompleted ? 100 : isJoined ? (c.progress ?? 5) : 12;
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-[9px] font-mono font-bold text-[#888888] mb-1.5 tracking-wider">
                      <span className="truncate mr-2">{c.title}</span>
                      {!isJoined && !isCompleted ? (
                        <button
                          onClick={() => onJoinChallenge(c.id)}
                          className="text-brand-blue hover:text-white tracking-widest shrink-0 transition-colors"
                        >
                          JOIN +
                        </button>
                      ) : (
                        <span className={isCompleted ? "text-brand-green" : "text-brand-blue"}>
                          {isCompleted ? "Completed" : `${c.progress ?? 0}% done`}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-brand-black rounded-full overflow-hidden">
                      <div
                        className={isCompleted ? "glow-secondary h-full rounded-full" : "h-full rounded-full transition-all duration-700"}
                        style={{ width: `${barWidth}%`, backgroundColor: barColor, opacity: isJoined ? 1 : 0.35 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Logs console tracker directly at the bottom */}
      <section className="bento-card p-0 flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-border bg-[#1a1c1e] flex justify-between items-center text-[10px] font-mono tracking-widest text-[#888888] font-bold">
          <span>Recent Activity</span>
          <span className="text-[9px] bg-white/5 border border-brand-border px-1.5 py-0.5 rounded uppercase">
            Live
          </span>
        </div>
        <div className="divide-y divide-brand-border/55 max-h-47.5 overflow-y-auto font-mono text-[10px] tracking-wide">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-[#888888] italic">
              No activity yet. Adjust carbon values in the calculator.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex justify-between items-center px-5 py-2.5 hover:bg-[#1a1c1e]/40 transition-colors">
                <span className="text-[#888888] shrink-0 font-medium">{log.time}</span>
                <span className="text-white truncate px-4 flex-1 text-left">{log.text}</span>
                <span
                  className={`shrink-0 font-bold px-2 rounded-sm ${
                    log.impact.startsWith("-") || log.impact === "STABLE"
                      ? "text-brand-green"
                      : log.impact.startsWith("+")
                      ? "text-red-400"
                      : "text-brand-blue"
                  }`}
                >
                  {log.impact}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
