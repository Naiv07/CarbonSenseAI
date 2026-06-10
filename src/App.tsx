import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import CalculatorView from "./components/CalculatorView";
import InsightsView from "./components/InsightsView";
import GoalsView from "./components/GoalsView";
import ProfileView from "./components/ProfileView";
import SettingsView from "./components/SettingsView";
import OnboardingView from "./components/OnboardingView";
import InfoView from "./components/InfoView";
import DailyView from "./components/DailyView";
import BottomNav from "./components/BottomNav";
import AuthGate from "./components/AuthGate";

import { TelemetryState, EmissionsBreakdown, Challenge, ActivityLog, SimulationState, CommanderState, EmissionSnapshot, Achievement } from "./types";
import { ArrowRight, RefreshCw, Terminal } from "lucide-react";
import { useToast } from "./context/ToastContext";
import { getCurrencySymbol } from "./utils/currency";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function App() {
  const { addToast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setFirebaseUser(u));
  }, []);

  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [hasSeenInfo, setHasSeenInfo] = useState<boolean>(() => localStorage.getItem("csai_info_seen") === "true");
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => localStorage.getItem("csai_onboarded") === "true");
  const [userLocation, setUserLocation] = useState({ name: "", country: "", city: "" });
  const [currentTab, setTab] = useState<string>("DASHBOARD");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isGateLoading, setIsGateLoading] = useState<boolean>(false);
  const [dataReady, setDataReady] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<TelemetryState>({
    mileage: 12500,
    commuteFrequency: "DAILY",
    vehicleType: "INTERNAL_COMBUSTION_MEDIUM",
    flightsShortHaul: 0,
    flightsLongHaul: 0,
    utilityBill: 185,
    energySource: "mixed",
    heatingType: "none",
    category: "TRANSPORT",
    meatIntake: "DAILY",
    foodWaste: "medium",
    recycledPercent: 40,
    shoppingFrequency: "average",
    newElectronics: 0,
    clothingType: "none",
  });

  const [breakdown, setBreakdown] = useState<EmissionsBreakdown>({
    transport: 2.25,
    energy: 0.84,
    food: 1.8,
    waste: 0.36,
    shopping: 0.5,
    total: 5.8,
  });

  const [missionScore, setMissionScore] = useState<number>(50);
  const [rank, setRank] = useState<string>("Climate Ranger");

  const [simulation, setSimulation] = useState<SimulationState>({
    plantBased: true,
    solarConversion: false,
    evMobility: true,
  });

  const [commander, setCommander] = useState<CommanderState>({
    warning: "Warning: Transport emissions exceeding limits in Sector B. Deploy biking initiative.",
    action: "EXECUTE_DEPLOY",
    projectedSaving: "-0.4 MT",
    sector: "Sector B",
    status: "ACTIVE",
  });

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [emissionHistory, setEmissionHistory] = useState<EmissionSnapshot[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<number>(1);
  const [baselineEmissions, setBaselineEmissions] = useState<number>(0);

  const withAuth = async (options: RequestInit = {}): Promise<RequestInit> => {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    if (!token) return options;
    return {
      ...options,
      headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
    };
  };

  const resilientFetch = async (url: string, options?: RequestInit, retries = 4, delay = 1000): Promise<Response> => {
    try {
      const authedOptions = await withAuth(options);
      const res = await fetch(url, authedOptions);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (error) {
      if (retries > 0) {
        console.warn(`Fetch to ${url} failed, retrying in ${delay}ms...`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return resilientFetch(url, options, retries - 1, delay * 1.5);
      }
      throw error;
    }
  };

  const fetchInitialTelemetry = async () => {
    try {
      const res = await resilientFetch("/api/telemetry");
      const data = await res.json();
      if (data) {
        setTelemetry(data.telemetry);
        setBreakdown(data.breakdown);
        setSimulation(data.activeSimulation);
        setCommander(data.commanderRecommendation);
        if (data.missionScore !== undefined) setMissionScore(data.missionScore);
        if (data.rank) setRank(data.rank);
        if (data.userLocation) setUserLocation(data.userLocation);
        if (data.emissionHistory) setEmissionHistory(data.emissionHistory);
        if (data.achievements) setAchievements(data.achievements);
        if (data.streak !== undefined) setStreak(data.streak);
        if (data.baselineEmissions !== undefined) setBaselineEmissions(data.baselineEmissions);
      }
      setDataReady(true);
    } catch (e) {
      console.error("Error reading initial telemetry from server:", e);
      addToast("Error: Sync failed — showing last known values.", "WARNING");
      setDataReady(true);
    }
  };

  const handleOnboardingComplete = async (data: any) => {
    try {
      const res = await fetch("/api/onboarding", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }));
      if (res.ok) {
        const result = await res.json();
        if (result.breakdown) setBreakdown(result.breakdown);
        if (result.missionScore !== undefined) setMissionScore(result.missionScore);
        if (result.rank) setRank(result.rank);
        if (result.userLocation) setUserLocation(result.userLocation);
        if (result.emissionHistory) setEmissionHistory(result.emissionHistory);
        if (result.achievements) setAchievements(result.achievements);
        if (result.streak !== undefined) setStreak(result.streak);
        if (result.baselineEmissions !== undefined) setBaselineEmissions(result.baselineEmissions);
      } else {
        addToast("Warning: Server sync partial — loading defaults. Recalibrate in Calculator.", "WARNING");
      }
    } catch (e) {
      console.error("Error submitting onboarding data:", e);
      addToast("Warning: Offline mode — baseline estimated. Sync when connected.", "WARNING");
    }
    // Always navigate — never leave the user stranded on step 6
    localStorage.setItem("csai_onboarded", "true");
    setHasOnboarded(true);
    fetchInitialTelemetry();
    fetchLogs();
  };

  const fetchLogs = async () => {
    try {
      const res = await resilientFetch("/api/logs");
      const data = await res.json();
      if (data) setLogs(data);
    } catch (e) {
      console.error("Error reading activity logs:", e);
      addToast("Warning: Activity log unavailable — connection issue.", "WARNING");
    }
  };

  const fetchChallenges = async () => {
    try {
      const res = await resilientFetch("/api/challenges");
      const data = await res.json();
      if (data?.challenges) {
        setChallenges(data.challenges);
        if (data.refreshed) {
          addToast("New challenges available this week!", "SUCCESS");
        }
      }
    } catch (e) {
      console.error("Error reading challenges list:", e);
      addToast("Warning: Challenge data unavailable — retrying on next sync.", "WARNING");
    }
  };

  useEffect(() => {
    fetchInitialTelemetry();
    fetchLogs();
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateTelemetry = async (updated: Partial<TelemetryState>) => {
    setTelemetry({ ...telemetry, ...updated });
    try {
      const res = await fetch("/api/telemetry", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }));
      const data = await res.json();
      if (data.success && data.breakdown) {
        setBreakdown(data.breakdown);
        if (data.missionScore !== undefined) setMissionScore(data.missionScore);
        if (data.rank) setRank(data.rank);
        if (data.emissionHistory) setEmissionHistory(data.emissionHistory);
        if (data.achievements) setAchievements(data.achievements);
        if (data.streak !== undefined) setStreak(data.streak);
        fetchLogs();
      }
    } catch (e) {
      console.error("Error committing telemetry changes to server:", e);
    }
  };

  const handleUpdateSimulation = async (updated: Partial<SimulationState>) => {
    setSimulation({ ...simulation, ...updated });
    try {
      const res = await fetch("/api/simulation", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }));
      const data = await res.json();
      if (data.success && data.breakdown) {
        setBreakdown(data.breakdown);
        if (data.missionScore !== undefined) setMissionScore(data.missionScore);
        if (data.rank) setRank(data.rank);
        if (data.achievements) setAchievements(data.achievements);
        if (data.streak !== undefined) setStreak(data.streak);
        fetchLogs();
      }
    } catch (e) {
      console.error("Error committing simulation updates to server:", e);
    }
  };

  const handleJoinChallenge = async (id: string) => {
    try {
      const res = await fetch("/api/challenges/join", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }));
      const data = await res.json();
      if (data.success && data.challenges) {
        setChallenges(data.challenges);
        if (data.missionScore !== undefined) setMissionScore(data.missionScore);
        if (data.rank) setRank(data.rank);
        fetchLogs();
      }
    } catch (e) {
      console.error("Error joining goals challenge:", e);
    }
  };

  const toggleChallengeTask = async (challengeId: string, taskId: string) => {
    // Optimistic update — flip the task immediately so the UI feels instant
    setChallenges(prev =>
      prev.map(c =>
        c.id !== challengeId ? c : {
          ...c,
          tasks: c.tasks?.map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        }
      )
    );
    try {
      const res = await fetch(
        `/api/challenges/${challengeId}/tasks/${taskId}/toggle`,
        await withAuth({ method: "POST" })
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Sync with server's authoritative state (progress recalculated server-side)
      setChallenges(prev =>
        prev.map(c =>
          c.id !== challengeId ? c : {
            ...c,
            progress: data.progress,
            tasks: c.tasks?.map(t => t.id === taskId ? data.task : t),
          }
        )
      );
    } catch (e) {
      console.error("Error toggling challenge task:", e);
      // Revert the optimistic update on failure
      setChallenges(prev =>
        prev.map(c =>
          c.id !== challengeId ? c : {
            ...c,
            tasks: c.tasks?.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            ),
          }
        )
      );
      addToast("Sign in to save task progress across sessions.", "WARNING");
    }
  };

  const handleRefreshCommander = async (customPrompt?: string) => {
    try {
      const res = await fetch("/api/ai/commander", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customPrompt }),
      }));
      const data = await res.json();
      if (data.text) {
        setCommander(prev => ({ ...prev, warning: data.text, status: "ACTIVE" }));
        fetchLogs();
      } else {
        addToast("AI advisor is temporarily unavailable — try again in a moment.", "WARNING");
      }
    } catch (e) {
      console.error("Error prompting AI commander:", e);
      addToast("AI advisor is temporarily unavailable — try again in a moment.", "WARNING");
    }
  };

  const handleDeployRecommendation = async (actionType: string) => {
    try {
      const res = await fetch("/api/commander-action", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "deploy", action: actionType }),
      }));
      const data = await res.json();
      if (data.success) {
        setCommander(data.commanderRecommendation);
        fetchInitialTelemetry();
        fetchLogs();
      }
    } catch (e) {
      console.error("Error deploying tactical recommendations:", e);
    }
  };

  const handleDismissRecommendation = async () => {
    try {
      const res = await fetch("/api/commander-action", await withAuth({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: "dismiss" }),
      }));
      const data = await res.json();
      if (data.success) setCommander(data.commanderRecommendation);
    } catch (e) {
      console.error("Error dismissing recommendation panels:", e);
    }
  };

  const handleExecuteSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", await withAuth({ method: "POST" }));
      const data = await res.json();
      if (data.success) {
        fetchInitialTelemetry();
        fetchLogs();
      }
    } catch (e) {
      console.error("Error executing unified system synchronizer:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 900);
    }
  };

  const handleDeployImmediateInitiative = () => {
    handleUpdateTelemetry({ commuteFrequency: "REMOTE" });
    addToast("Initiative applied. Commute set to remote.", "SUCCESS");
  };

  const handleResetData = async () => {
    addToast("Data reset. Recalibrating your baseline.", "SYS");
    try {
      await fetch("/api/reset", await withAuth({ method: "POST" }));
    } catch (e) {
      console.error("Error calling server reset:", e);
    }
    localStorage.removeItem("csai_onboarded");
    localStorage.removeItem("csai_info_seen");
    setHasOnboarded(false);
    setHasSeenInfo(false);
    setIsEntered(false);
    fetchInitialTelemetry();
    fetchLogs();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast("Signed out successfully.", "SYS");
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const handleEnterMissionControl = () => {
    setIsGateLoading(true);
    setTimeout(() => {
      setIsEntered(true);
      setIsGateLoading(false);
    }, 1500);
  };

  const totalOffsetsSaved = baselineEmissions > 0 ? Math.max(0, baselineEmissions - breakdown.total) : 0;
  const currencySymbol = getCurrencySymbol(userLocation.country);

  // --- Info Screen (shown once to all new visitors, including guests) ---
  if (isEntered && !hasSeenInfo) {
    return (
      <InfoView
        onContinue={() => {
          localStorage.setItem("csai_info_seen", "true");
          setHasSeenInfo(true);
        }}
      />
    );
  }

  // --- Onboarding Screen ---
  if (isEntered && !hasOnboarded) {
    return (
      <AuthGate>
        <OnboardingView onComplete={handleOnboardingComplete} />
      </AuthGate>
    );
  }

  // --- Gateway / Landing Screen ---
  if (!isEntered) {
    return (
      <main className="min-h-screen bg-[#070708] technical-grid relative flex items-center justify-center p-6 starfield overflow-hidden">
        <div className="scanline"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5e6bff]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-120 h-120 bg-[#bec2ff]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl w-full bg-[#101112]/90 border border-[#1f2023] p-5 sm:p-8 md:p-10 lg:p-12 rounded relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row gap-8 lg:gap-10 items-center">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#bec2ff] font-mono text-[11px] font-bold tracking-[0.25em] uppercase">
                <Terminal className="w-4 h-4 text-[#bec2ff]" />
                <span>Take Control of Your Carbon</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
                Planetary-Scale <br className="hidden md:inline" />
                <span className="text-[#bec2ff] relative">Carbon Control</span>
              </h1>
            </div>

            <p className="text-[#c6c5d8] text-sm md:text-base leading-relaxed font-sans max-w-lg">
              Monitor strategic transport bounds, evaluate thermal energy grids, coordinate global reforestation offsets, and execute warning mitigation matrix routines powered by AI Commander guidance.
            </p>

            <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-[#1f2023]/60 max-w-md">
              <div>
                <span className="text-[9px] font-mono font-bold text-[#8f8fa1] tracking-wider block">Tracking</span>
                <span className="text-sm font-mono text-white font-bold tracking-widest block mt-0.5">Active</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-[#8f8fa1] tracking-wider block">Reducing</span>
                <span className="text-sm font-mono text-white font-bold tracking-widest block mt-0.5">Stable</span>
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-[#8f8fa1] tracking-wider block">AI Version</span>
                <span className="text-sm font-mono text-[#bec2ff] font-bold tracking-widest block mt-0.5">v2.0</span>
              </div>
            </div>

            <button
              onClick={handleEnterMissionControl}
              disabled={isGateLoading}
              className="px-8 py-4 bg-[#bec2ff] text-[#000ba6] text-xs font-mono font-extrabold tracking-widest transition-all rounded shadow-[0_0_25px_rgba(190,194,255,0.35)] hover:bg-[#d0d3ff] hover:shadow-[0_0_35px_rgba(190,194,255,0.5)] active:scale-95 flex items-center gap-2 uppercase"
            >
              {isGateLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="hidden sm:flex w-full lg:w-96 shrink-0 border border-[#1f2023] p-4 bg-[#0d0e0f] rounded relative flex-col justify-between h-72 sm:h-80 lg:h-96 group">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider font-bold">
              <span className="text-[#8f8fa1] uppercase">Carbon Grid</span>
              <span className="text-[#22c55e] animate-pulse">● Online</span>
            </div>
            <div className="h-60 w-full relative flex items-center justify-center opacity-75 group-hover:opacity-100 transition-opacity">
              <img
                alt="Planetary Climate Grid Earth Map"
                className="w-full h-full object-contain filter invert opacity-50 relative z-10"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzqTRPDZEtIiwFPcHVwkwRSnyHhtKodv6uMRK1nrO4wvvw6c57jO7nK3s6afGRxSmkTpUhAVXQzooq4vXkzw9gITewx6Cb2oQZE84MROiFiv7QSKoZd6YDN6txHrMn8hufR9-EY35lncm3J0l9FzsLvkIbgH5g7dmTcSMUk3b-bpSwqO0uwUy_CjQFmV1EHDhUKS-TN7r6DclCZKUCXn5fdWxH6ohjRD6kyKh0GLzfzbkwfFW5QwjhVPenNDu_42j97ANlom9SS1CN"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-[#5e6bff]/10 to-transparent map-sweep pointer-events-none z-20"></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono tracking-wider font-bold text-[#bec2ff] uppercase">
              <span>Step 1: Connect</span>
              <span>Step 2: Reduce</span>
              <span>Step 3: Cap</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- Main Dashboard Layout ---
  return (
    <AuthGate>
    <main className="min-h-screen bg-[#070708] text-[#e3e2e3] font-sans pt-16 pb-24 md:pb-6">
      <div className="scanline"></div>

      <Header currentTab={currentTab} setTab={setTab} onSync={handleExecuteSyncAll} isSyncing={isSyncing} userPhotoURL={firebaseUser?.photoURL ?? null} />

      <div className="flex">
        <Sidebar currentTab={currentTab} setTab={setTab} onDeployInitiative={handleDeployImmediateInitiative} onReset={handleResetData} />

        <BottomNav currentTab={currentTab} setTab={setTab} />

        <section className="flex-1 p-3 sm:p-4 md:p-6 md:pl-[280px] min-h-[calc(100vh-64px)] overflow-x-hidden">
          {currentTab === "DASHBOARD" && (
            <DashboardView
              breakdown={breakdown}
              logs={logs}
              challenges={challenges}
              commander={commander}
              missionScore={missionScore}
              rank={rank}
              emissionHistory={emissionHistory}
              achievements={achievements}
              onDeployRecommendation={handleDeployRecommendation}
              onDismissRecommendation={handleDismissRecommendation}
              onRefreshCommander={handleRefreshCommander}
              onJoinChallenge={handleJoinChallenge}
            />
          )}

          {currentTab === "CALCULATOR" && (
            <CalculatorView
              telemetry={telemetry}
              breakdown={breakdown}
              currencySymbol={currencySymbol}
              onUpdateTelemetry={handleUpdateTelemetry}
              onExecuteSync={handleExecuteSyncAll}
            />
          )}

          {currentTab === "INSIGHTS" && (
            <InsightsView
              simulation={simulation}
              breakdown={breakdown}
              achievements={achievements}
              emissionHistory={emissionHistory}
              baselineEmissions={baselineEmissions}
              dataReady={dataReady}
              onUpdateSimulation={handleUpdateSimulation}
              onDeployPlan={handleDeployImmediateInitiative}
            />
          )}

          {currentTab === "GOALS" && (
            <GoalsView challenges={challenges} missionScore={missionScore} onToggleChallenge={handleJoinChallenge} onToggleTask={toggleChallengeTask} />
          )}

          {currentTab === "DAILY" && (
            <DailyView city={userLocation.city} country={userLocation.country} />
          )}

          {currentTab === "PROFILE" && (
            <ProfileView
              logs={logs}
              totalSaved={totalOffsetsSaved}
              missionScore={missionScore}
              rank={rank}
              name={firebaseUser?.displayName ?? userLocation.name}
              photoURL={firebaseUser?.photoURL ?? null}
              city={userLocation.city}
              country={userLocation.country}
              streak={streak}
              challenges={challenges}
              achievements={achievements}
              onLogout={firebaseUser ? handleLogout : undefined}
            />
          )}

          {currentTab === "SETTINGS" && (
            <SettingsView onReset={handleResetData} />
          )}
        </section>
      </div>
    </main>
    </AuthGate>
  );
}
