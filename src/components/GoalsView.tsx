import React from "react";
import { Challenge } from "../types";
import { Users, ShieldAlert, Award, Lock } from "lucide-react";

interface GoalsViewProps {
  challenges: Challenge[];
  missionScore?: number;
  onToggleChallenge: (id: string) => void;
}

export default function GoalsView({ challenges, missionScore = 0, onToggleChallenge }: GoalsViewProps) {
  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-baseline gap-4">
        <h2 className="text-xl font-display font-extrabold text-brand-blue uppercase tracking-wide">
          Mission_Goals
        </h2>
        <span className="text-[10px] font-mono bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-0.5 rounded tracking-widest font-bold font-mono">
          ACTIVE_OPERATIONS
        </span>
      </div>
      <p className="text-xs text-[#888888] -mt-4">
        Enlist in active climate challenge operations to reduce actual offsets and claim valuable commendation points.
      </p>

      {/* Challenge Grid cards */}
      {challenges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-[#444444]" />
          <p className="text-xs font-mono font-bold text-[#888888] tracking-widest uppercase">No active missions found</p>
          <p className="text-[10px] font-mono text-[#555555]">Mission data is loading or unavailable. Check your connection and try refreshing.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => {
          const isJoined = challenge.status === "JOINED";
          const isLocked = challenge.status === "LOCKED";

          return (
            <div
              key={challenge.id}
              className={`bg-brand-dark border text-left rounded-3xl overflow-hidden flex flex-col justify-between group transition-all relative ${
                isJoined
                  ? "border-brand-green shadow-[0_4px_20px_rgba(0,255,102,0.15)]"
                  : "border-brand-border hover:border-brand-blue/50"
              }`}
            >
              {/* Image hotlink cover */}
              <div className="h-44 w-full overflow-hidden relative bg-brand-black">
                <img
                  alt={challenge.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  src={challenge.image}
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Category Label */}
                <div className="absolute top-3 left-3 bg-brand-black/85 border border-brand-border px-2 py-1 text-[8px] font-mono font-bold tracking-widest text-brand-blue uppercase rounded-[8px]">
                  {challenge.category}
                </div>

                {challenge.urgency && (
                  <div className="absolute bottom-3 left-3 bg-red-950/95 border border-red-500/30 text-red-500 px-2.5 py-1 text-[8px] font-mono font-bold tracking-wider flex items-center gap-1 uppercase rounded-sm">
                    <ShieldAlert className="w-3 h-3 animate-pulse text-red-500" />
                    <span>{challenge.urgency}</span>
                  </div>
                )}
              </div>

              {/* Card Content parameters */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-mono font-bold text-white tracking-widest leading-normal">
                      {challenge.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-brand-blue shrink-0">
                      <Award className="w-4.5 h-4.5 text-brand-blue" />
                      <span>+{challenge.xpReward} XP</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#888888] leading-relaxed">
                    {challenge.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-brand-border flex flex-col gap-3">
                  {/* Status checklist metrics */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#888888] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{challenge.participants}</span>
                    </span>
                    <span className={isJoined ? "text-brand-green" : ""}>
                      {challenge.status}
                    </span>
                  </div>

                  {/* Real progress bar for joined challenges */}
                  {isJoined && (
                    <div className="space-y-1">
                      <div className="h-1 bg-brand-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-green transition-all duration-700"
                          style={{ width: `${challenge.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-brand-blue font-bold tracking-widest">
                        {challenge.progress ?? 0}% MISSION PROGRESS
                      </span>
                    </div>
                  )}

                  {/* Joined/Unlocked CTA Buttons */}
                  {isLocked ? (
                    <div className="w-full bg-brand-black/80 border border-brand-border py-2.5 px-4 rounded-xl flex flex-col gap-1.5 cursor-not-allowed">
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#888888]">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>TIER 3 COMMANDER ACCESS REQ.</span>
                      </div>
                      <div className="h-1 bg-brand-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-orange transition-all duration-700"
                          style={{ width: `${Math.min(100, Math.round((missionScore / 60) * 100))}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-brand-orange font-bold tracking-widest">
                        {missionScore >= 60 ? "UNLOCKING..." : `${missionScore}/60 PTS TO UNLOCK`}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onToggleChallenge(challenge.id)}
                      className={`w-full py-2.5 text-[10px] font-mono font-extrabold tracking-widest uppercase transition-all rounded-xl ${
                        isJoined
                          ? "bg-brand-green text-brand-black hover:opacity-90 shadow-[0_4px_15px_rgba(0,255,102,0.2)]"
                          : "bg-brand-blue hover:brightness-110 text-brand-black shadow-[0_4px_15px_rgba(0,242,255,0.2)]"
                      }`}
                    >
                      {isJoined ? "LEAVE_MISSION" : "JOIN_MISSION"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
