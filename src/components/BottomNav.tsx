import React from "react";
import { LayoutDashboard, Calculator, BarChart3, Target, User, Newspaper } from "lucide-react";

interface BottomNavProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: "DASHBOARD", label: "HOME", icon: LayoutDashboard },
  { id: "CALCULATOR", label: "CALC", icon: Calculator },
  { id: "INSIGHTS", label: "INSIGHTS", icon: BarChart3 },
  { id: "GOALS", label: "GOALS", icon: Target },
  { id: "DAILY", label: "DAILY", icon: Newspaper },
  { id: "PROFILE", label: "PROFILE", icon: User },
];

export default function BottomNav({ currentTab, setTab }: BottomNavProps) {
  return (
    <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-dark/95 backdrop-blur-md border-t border-brand-border flex">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = currentTab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-label={label.charAt(0) + label.slice(1).toLowerCase()}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
              isActive ? "text-brand-green" : "text-[#555555] hover:text-[#888888]"
            }`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className={`text-[8px] font-mono font-bold tracking-widest uppercase ${isActive ? "text-brand-green" : ""}`}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-brand-green rounded-t-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
