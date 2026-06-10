import React, { useState } from "react";
import { Bell, Settings, Search, RefreshCw, User } from "lucide-react";
import { useToast } from "../context/ToastContext";

interface HeaderProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  userPhotoURL?: string | null;
}

const TAB_SEARCH_MAP: Record<string, string> = {
  dashboard: "DASHBOARD", home: "DASHBOARD",
  calculator: "CALCULATOR", calc: "CALCULATOR", emissions: "CALCULATOR", carbon: "CALCULATOR",
  insights: "INSIGHTS", analysis: "INSIGHTS", charts: "INSIGHTS",
  goals: "GOALS", challenges: "GOALS", missions: "GOALS",
  profile: "PROFILE", account: "PROFILE", rank: "PROFILE",
  settings: "SETTINGS", config: "SETTINGS",
};

export default function Header({ currentTab, setTab, onSync, isSyncing, userPhotoURL }: HeaderProps) {
  const { addToast } = useToast();
  const [searchVal, setSearchVal] = useState("");

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !searchVal.trim()) return;
    const match = TAB_SEARCH_MAP[searchVal.trim().toLowerCase()];
    if (match) {
      setTab(match);
      setSearchVal("");
    } else {
      addToast(`No match for "${searchVal.trim()}" — try Dashboard, Calculator, Goals, Insights, Profile`, "WARNING");
      setSearchVal("");
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-brand-dark/95 backdrop-blur-md border-b border-brand-border">
      <div className="flex items-center gap-8">
        <span 
          onClick={() => setTab("DASHBOARD")}
          className="text-xl font-display font-bold tracking-tighter text-brand-blue cursor-pointer hover:opacity-80 transition-opacity"
        >
          CarbonSense
        </span>
        <nav className="hidden lg:flex items-center gap-6">
          {["DASHBOARD", "CALCULATOR", "INSIGHTS", "GOALS", "PROFILE"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              aria-current={currentTab === tab ? "page" : undefined}
              className={`text-xs font-mono tracking-widest font-bold py-5 px-1 border-b-2 transition-all duration-200 ${
                currentTab === tab
                  ? "text-brand-blue border-brand-blue"
                  : "text-[#888888] border-transparent hover:text-white hover:border-brand-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="hidden md:flex bg-brand-black items-center px-3 py-1.5 rounded-xl border border-brand-border focus-within:border-brand-blue">
          <Search className="text-[#888888] w-4 h-4 mr-2" aria-hidden="true" />
          <input
            className="bg-transparent border-none text-[11px] font-mono tracking-wider focus:outline-none focus:ring-0 w-32 text-white placeholder-[#888888]"
            placeholder="Search..."
            type="search"
            aria-label="Navigate to section"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearchKey}
          />
        </div>

        {/* Diagnostic Action Controls */}
        <div className="flex gap-1">
          <button
            onClick={() => setTab("DASHBOARD")}
            className="text-brand-blue hover:bg-brand-border p-2 rounded transition-colors"
            title="View mission status"
            aria-label="View mission status"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setTab("SETTINGS")}
            className={`p-2 rounded transition-colors ${currentTab === "SETTINGS" ? "text-white bg-brand-border" : "text-brand-blue hover:bg-brand-border"}`}
            title="Systems Configuration"
            aria-label="Settings"
            aria-current={currentTab === "SETTINGS" ? "page" : undefined}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Profile Avatar */}
        <button
          onClick={() => setTab("PROFILE")}
          aria-label="View profile"
          className="h-8 w-8 rounded-full overflow-hidden border border-[#888888] hover:border-brand-blue cursor-pointer transition-colors shrink-0 bg-brand-black flex items-center justify-center"
        >
          {userPhotoURL ? (
            <img
              alt="Your profile"
              className="w-full h-full object-cover"
              src={userPhotoURL}
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-4 h-4 text-[#888888]" aria-hidden="true" />
          )}
        </button>

        {/* Sync Trigger */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          aria-label={isSyncing ? "Syncing data…" : "Sync data"}
          className="bg-brand-green/15 border border-brand-green/30 text-brand-green px-3 py-1.5 text-[11px] font-mono tracking-wider hover:bg-brand-green/25 active:scale-95 transition-all flex items-center gap-1.5 rounded"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
          {isSyncing ? "Syncing..." : "Sync"}
        </button>
      </div>
    </header>
  );
}
