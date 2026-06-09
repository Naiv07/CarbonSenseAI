import React from "react";
import { ActivityLog, Challenge, Achievement } from "../types";
import { ShieldCheck, Award, Zap, Globe, Flame, Calendar, Leaf, Sun, Plane, Wifi, RefreshCw } from "lucide-react";

interface ProfileViewProps {
  logs: ActivityLog[];
  totalSaved: number;
  missionScore: number;
  rank: string;
  name?: string;
  city?: string;
  country?: string;
  streak?: number;
  challenges?: Challenge[];
  achievements?: Achievement[];
}

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  recycle: <RefreshCw className="w-4 h-4" />,
  sun: <Sun className="w-4 h-4" />,
  leaf: <Leaf className="w-4 h-4" />,
  plane: <Plane className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  wifi: <Wifi className="w-4 h-4" />,
};

export default function ProfileView({ logs, totalSaved, missionScore, rank, name = "COMMANDER", city = "", country = "", streak = 1, challenges = [], achievements = [] }: ProfileViewProps) {
  const tierProgress = missionScore % 10 === 0 && missionScore > 0 ? 100 : (missionScore % 10) * 10;
  const pointsToNextRank = missionScore >= 100 ? 0 : 10 - (missionScore % 10);
  const estimatedXP = missionScore * 150;
  const joinedCount = challenges.filter(c => c.status === "JOINED" || c.status === "COMPLETED").length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  return (
    <div className="space-y-6">
      
      {/* Officer Dossier Section */}
      <section className="bento-card flex flex-col md:flex-row gap-6 items-center">
        {/* Dossier Image Avatar */}
        <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-brand-blue/60 shrink-0 shadow-[0_4px_20px_rgba(0,242,255,0.15)] bg-brand-black">
          <img
            alt="Commander Dossier Photo"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5Nq-3_BTclXxH5F-jyc_7QQZyjgF9DdruLQnDxySjr7FaBZ7xnjXQP4m8bDyKKHnLpaIivwqG5mQNWwIKdQ_X1bAPms3Jno4WOeCxKZEMDLcGmqlvkmsKFsSkJY7dvPcA_zSS9dLFXfnd3vrEWNGXXV9qUo02t0Zh7wng0MraZ47jrXNvafoBsHF2JitVsn7VZ-X1VypLT1R8UXTWn36-t3Aa5nphSUsaaJ_6ZU3lHV5wi9rp_1yR5_MWd9i3dAN7LMZMX9GKUMwj"
          />
        </div>

        {/* Dossier Information Parameters */}
        <div className="flex-1 space-y-4 font-mono text-center md:text-left">
          <div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-2 justify-center md:justify-start">
              <span className="text-xl font-display font-extrabold text-white tracking-widest uppercase">CDR. {name.toUpperCase()}</span>
              <span className="text-[10px] bg-brand-blue/10 border border-brand-blue/20 text-brand-blue px-2 py-0.5 rounded font-bold tracking-widest uppercase">
                {rank.toUpperCase().replace(/\s+/g, "_")}
              </span>
            </div>
            
            <p className="text-xs text-[#888888] mt-1.5 leading-relaxed font-sans">
              Designated Commander of {city ? `${city}, ` : ""}{country || "Sector Bravo"} Climate Mission Operations. Sector metrics under surveillance.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-brand-black/70 border border-brand-border rounded-xl">
              <span className="text-[8px] text-[#888888] tracking-widest block font-bold uppercase">STATION</span>
              <span className="text-xs text-white font-bold tracking-wider uppercase">{city ? city.toUpperCase().replace(/\s+/g, "_") : "BRAVO_UNIT"}</span>
            </div>

            <div className="p-3 bg-brand-black/70 border border-brand-border rounded-xl">
              <span className="text-[8px] text-[#888888] tracking-widest block font-bold uppercase">SECURITY_CLEARANCE</span>
              <span className="text-xs text-brand-green font-bold tracking-wider uppercase">TIER_{Math.ceil(missionScore / 10) || 1}_EXEC</span>
            </div>

            <div className="p-3 bg-brand-black/70 border border-brand-border rounded-xl">
              <span className="text-[8px] text-[#888888] tracking-widest block font-bold uppercase">CUMULATIVE_XP</span>
              <span className="text-xs text-brand-orange font-bold tracking-wider uppercase">{estimatedXP.toLocaleString()} XP</span>
            </div>

            <div className="p-3 bg-brand-black/70 border border-brand-border rounded-xl">
              <span className="text-[8px] text-[#888888] tracking-widest block font-bold uppercase">DEPLOYMENT_STREAK</span>
              <span className="text-xs text-red-500 font-bold tracking-wider uppercase flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-brand-orange fill-brand-orange animate-pulse" />
                <span>{streak} {streak === 1 ? "CYCLE" : "CYCLES"}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Scoreboard Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cumulative Savings Scoreboard */}
        <div className="bento-card space-y-3">
          <div className="flex items-center gap-2 text-brand-green">
            <Globe className="w-4 h-4" />
            <span className="text-[9px] font-mono tracking-widest font-bold uppercase">01_CUMULATIVE_OFFSETS</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {totalSaved > 0 ? `+${totalSaved.toFixed(1)}` : "0.0"} <span className="text-sm font-bold text-[#888888]">TONNES</span>
          </div>
          <p className="text-xs text-[#888888] font-sans">
            Total projected carbon footprint diverted from atmosphere cycle to cycle.
          </p>
        </div>

        {/* Missions Authorized */}
        <div className="bento-card space-y-3">
          <div className="flex items-center gap-2 text-brand-blue">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-mono tracking-widest font-bold uppercase">02_MISSIONS_AUTHORIZED</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {joinedCount} / {challenges.length || 3} <span className="text-sm font-bold text-[#888888]">ENGAGED</span>
          </div>
          <p className="text-xs text-[#888888] font-sans">
            Active compliance with renewable utility matrices and transportation offsets.
          </p>
        </div>

        {/* Next Rank Qualification */}
        <div className="bento-card space-y-3">
          <div className="flex items-center gap-2 text-brand-orange">
            <Award className="w-4 h-4" />
            <span className="text-[9px] font-mono tracking-widest font-bold uppercase">03_NEXT_RANK_UPGRADE</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {tierProgress}% <span className="text-sm font-bold text-[#888888]">LOCK</span>
          </div>
          <p className="text-xs text-[#888888] font-sans">
            Current rank: {rank}. {pointsToNextRank > 0 ? `Earn ${pointsToNextRank} more score points to advance.` : "Maximum rank achieved."}
          </p>
        </div>

      </section>

      {/* Achievements / Clearance Badges */}
      {achievements.length > 0 && (
        <section className="bento-card">
          <div className="flex justify-between items-center mb-4 border-b border-brand-border pb-4">
            <div>
              <h3 className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
                CLEARANCE_BADGES
              </h3>
              <p className="text-xs text-[#888888] mt-0.5 font-sans">
                {unlockedCount} of {achievements.length} operational achievements unlocked
              </p>
            </div>
            <Award className="w-4 h-4 text-brand-orange" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map(badge => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                  badge.unlocked
                    ? "border-brand-green/30 bg-brand-green/5"
                    : "border-brand-border bg-brand-black/70 opacity-40"
                }`}
              >
                <div className={`w-8 h-8 shrink-0 rounded flex items-center justify-center ${badge.unlocked ? "bg-brand-green/20 text-brand-green" : "bg-brand-border text-[#555555]"}`}>
                  {ACHIEVEMENT_ICONS[badge.icon] ?? <Award className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono font-bold tracking-wider text-white truncate">{badge.title}</p>
                  <p className="text-[8px] text-[#888888] font-sans mt-0.5">{badge.description}</p>
                  {badge.unlocked && (
                    <span className="text-[8px] font-mono text-brand-green font-bold tracking-wider">UNLOCKED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historical Officer Records log timeline box */}
      <section className="bento-card">
        <div className="flex justify-between items-center mb-4 border-b border-brand-border pb-4">
          <div>
            <h3 className="text-[10px] font-mono tracking-widest text-[#888888] font-bold">
              OFFICER_SERVICE_RECORDS
            </h3>
            <p className="text-xs text-[#888888] mt-0.5 font-sans">Chronicle log of all missions and telemetry events</p>
          </div>
          <Calendar className="w-4 h-4 text-[#888888]" />
        </div>

        <div className="space-y-4 font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4 items-start py-1 pb-3 border-b border-brand-border/30 last:border-0 last:pb-0">
              <span className="text-[10px] text-[#888888] tracking-wider shrink-0 mt-0.5">{log.time}</span>
              <div>
                <p className="text-white font-bold leading-normal uppercase">{log.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    log.type === "INIT" ? "bg-brand-green/10 text-brand-green" : log.type === "DATA" ? "bg-brand-blue/10 text-brand-blue" : "bg-white/5 text-[#888888]"
                  }`}>
                    STREAM_TYPE: {log.type}
                  </span>
                  <span className="text-[9px] text-[#888888] font-semibold">IMPACT: {log.impact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
