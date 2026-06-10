import React, { useState } from "react";
import { LayoutDashboard, Calculator, BarChart3, Target, User, Settings, Trash2, Terminal, Newspaper } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onDeployInitiative: () => void;
  onReset: () => void;
}

export default function Sidebar({ currentTab, setTab, onDeployInitiative, onReset }: SidebarProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const navItems = [
    { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
    { id: "CALCULATOR", label: "Calculator", icon: Calculator },
    { id: "INSIGHTS", label: "Insights", icon: BarChart3 },
    { id: "GOALS", label: "Challenges", icon: Target },
    { id: "DAILY", label: "Daily", icon: Newspaper },
    { id: "PROFILE", label: "Profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-brand-border bg-brand-dark">
      {/* Station Indicators */}
      <div className="p-6 border-b border-brand-border/60 bg-brand-black/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
            <Terminal className="text-brand-blue w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-display font-semibold tracking-wider text-brand-blue uppercase">
              CarbonSense
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse glow-secondary"></span>
              <p className="text-[9px] font-mono tracking-widest text-brand-green font-bold">
                Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-mono tracking-widest font-bold transition-all ${
                isActive
                  ? "bg-brand-green/10 text-brand-green border-r-4 border-brand-green glow-secondary/10"
                  : "text-[#888888] hover:text-white hover:bg-brand-border"
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? "text-brand-green" : "text-[#888888]"}`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Action Buttons at Footer */}
      <div className="p-4 border-t border-brand-border space-y-2 bg-brand-black/30">
        <button
          onClick={onDeployInitiative}
          aria-label="Apply immediate carbon reduction initiative"
          className="w-full bg-linear-to-r from-brand-blue to-[#0066ff] hover:opacity-90 text-brand-black py-3 text-[11px] font-mono font-extrabold tracking-widest active:scale-95 transition-all rounded-xl shadow-[0_4px_20px_rgba(0,242,255,0.25)] uppercase animate-pulse-subtle"
        >
          Take Action
        </button>

        <button
          onClick={() => setTab("SETTINGS")}
          aria-current={currentTab === "SETTINGS" ? "page" : undefined}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-[10px] font-mono tracking-widest transition-colors ${
            currentTab === "SETTINGS"
              ? "text-brand-green bg-brand-green/10 border-r-4 border-brand-green"
              : "text-[#888888] hover:text-white hover:bg-brand-border"
          }`}
        >
          <Settings className={`w-3.5 h-3.5 ${currentTab === "SETTINGS" ? "text-brand-green" : ""}`} aria-hidden="true" />
          <span>Settings</span>
        </button>

        {confirmReset ? (
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-red-400 text-center tracking-wide px-1">
              Reset all your data? This cannot be undone.
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => { setConfirmReset(false); onReset(); }}
                className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-mono font-bold tracking-widest rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 border border-brand-border text-[#888888] text-[9px] font-mono font-bold tracking-widest rounded-lg hover:bg-brand-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-[10px] font-mono tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Reset My Data</span>
          </button>
        )}
      </div>
    </aside>
  );
}
