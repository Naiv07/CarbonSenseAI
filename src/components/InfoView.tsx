import React from "react";
import { ArrowRight, Leaf, Zap, Target, Newspaper, ShieldCheck, Terminal } from "lucide-react";

interface InfoViewProps {
  onContinue: () => void;
}

const FEATURES = [
  {
    icon: Zap,
    color: "text-brand-blue",
    bg: "bg-brand-blue/10 border-brand-blue/20",
    title: "Track Your Emissions",
    desc: "Calculate your personal carbon footprint across transport, energy, diet, and shopping — updated in real time.",
  },
  {
    icon: Target,
    color: "text-brand-orange",
    bg: "bg-brand-orange/10 border-brand-orange/20",
    title: "Join Challenges",
    desc: "Enlist in climate operations to cut real emissions. Complete tasks, earn XP, and climb the Mission Score ranks.",
  },
  {
    icon: Leaf,
    color: "text-brand-green",
    bg: "bg-brand-green/10 border-brand-green/20",
    title: "AI-Powered Advisor",
    desc: "Get personalised, AI-generated recommendations tailored to your lifestyle, location, and current footprint.",
  },
  {
    icon: Newspaper,
    color: "text-[#bec2ff]",
    bg: "bg-[#5e6bff]/10 border-[#5e6bff]/20",
    title: "Daily Briefing",
    desc: "Receive a fresh environmental briefing every day, localised to your city and the issues that matter near you.",
  },
];

export default function InfoView({ onContinue }: InfoViewProps) {
  return (
    <main className="min-h-screen bg-[#070708] technical-grid relative flex items-center justify-center p-4 sm:p-6 overflow-hidden starfield">
      <div className="scanline" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5e6bff]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10 space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-brand-blue font-mono text-[11px] font-bold tracking-[0.25em] uppercase">
            <Terminal className="w-4 h-4" />
            <span>General Briefing · Mission Overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
            Welcome to <br />
            <span className="text-brand-blue">Carbon</span><span className="text-brand-green">Sense</span><span className="text-white">AI</span>
          </h1>
          <p className="text-sm text-[#c6c5d8] font-sans leading-relaxed max-w-lg">
            CarbonSenseAI is your personal climate mission control. We help you understand your environmental impact, set reduction goals, and take meaningful action — powered by AI.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className={`p-4 border rounded-2xl flex gap-3 bg-[#101112]/80 ${bg}`}>
              <div className={`w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className={`text-[10px] font-mono font-bold tracking-widest uppercase ${color}`}>{title}</p>
                <p className="text-xs text-[#888888] font-sans mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Data commitment */}
        <div className="p-4 border border-brand-green/20 bg-brand-green/5 rounded-2xl flex gap-3">
          <ShieldCheck className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono font-bold text-brand-green tracking-widest uppercase">Your Data Stays Private</p>
            <p className="text-xs text-[#888888] font-sans mt-1 leading-relaxed">
              Your footprint data is used only to calculate your personal emissions. Nothing is sold, shared, or used for advertising. You can reset or delete your data at any time from Settings.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="flex flex-wrap items-center gap-0 text-[10px] font-mono font-bold text-[#555555] tracking-widest uppercase">
          <span className="text-brand-blue">1. Set baseline</span>
          <span className="px-2">→</span>
          <span className="text-brand-orange">2. Join challenges</span>
          <span className="px-2">→</span>
          <span className="text-brand-green">3. Reduce &amp; track</span>
          <span className="px-2">→</span>
          <span className="text-[#bec2ff]">4. Earn rank</span>
        </div>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="w-full py-4 bg-brand-blue text-brand-black font-mono font-extrabold text-sm tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,242,255,0.3)] uppercase"
        >
          I Understand — Enter Mission Control
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <p className="text-[10px] text-[#444444] font-sans text-center">
          You can continue as a guest — no account required.
        </p>
      </div>
    </main>
  );
}
