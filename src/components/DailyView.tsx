import React, { useState, useEffect, useCallback } from "react";
import { Newspaper, RefreshCw, MapPin, Calendar, Leaf } from "lucide-react";

interface DailyInsight {
  insight: string;
  city: string;
  date: string;
  cached: boolean;
}

interface DailyViewProps {
  city?: string;
  country?: string;
}

export default function DailyView({ city = "", country = "" }: DailyViewProps) {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? "/api/daily-insight?refresh=true" : "/api/daily-insight";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInsight(data);
    } catch {
      setError("Could not load today's insight. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  const locationLabel = city ? (country ? `${city}, ${country}` : city) : country || "your area";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-baseline gap-4">
        <h2 className="text-xl font-display font-extrabold text-brand-blue uppercase tracking-wide">
          Daily Insight
        </h2>
        <span className="text-[10px] font-mono bg-brand-green/10 border border-brand-green/20 text-brand-green px-2 py-0.5 rounded tracking-widest font-bold">
          TODAY
        </span>
      </div>
      <p className="text-xs text-[#888888] -mt-4">
        Your personalised daily environmental briefing, tailored to where you live.
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#555555] font-bold tracking-widest uppercase">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" aria-hidden="true" />
          {locationLabel}
        </span>
        {insight && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {insight.date}
          </span>
        )}
      </div>

      {/* Insight card */}
      <div className="bento-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-brand-green" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-widest text-[#888888] uppercase">
                Environmental Briefing
              </p>
              <p className="text-[9px] font-mono text-[#555555] tracking-wider">
                {insight?.cached ? "Today's insight (cached)" : "Fresh insight for today"}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchInsight(true)}
            disabled={loading}
            aria-label={loading ? "Loading daily insight…" : "Refresh daily insight"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase border border-brand-border text-[#888888] hover:text-white hover:border-brand-blue/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {loading && (
            <div className="space-y-3 animate-pulse" aria-label="Loading insight…">
              <div className="h-3 bg-brand-border rounded w-full" />
              <div className="h-3 bg-brand-border rounded w-5/6" />
              <div className="h-3 bg-brand-border rounded w-4/6" />
              <div className="h-3 bg-brand-border rounded w-full mt-4" />
              <div className="h-3 bg-brand-border rounded w-3/4" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-8 space-y-2">
              <Newspaper className="w-8 h-8 text-[#444444] mx-auto" aria-hidden="true" />
              <p className="text-xs font-mono text-[#888888]">{error}</p>
              <button
                onClick={() => fetchInsight()}
                className="text-[10px] font-mono font-bold text-brand-blue hover:opacity-80 tracking-widest uppercase mt-2"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && insight && !error && (
            <p className="text-sm text-[#cccccc] leading-relaxed font-sans whitespace-pre-wrap">
              {insight.insight}
            </p>
          )}
        </div>
      </div>

      {/* Tip card */}
      {!loading && insight && !error && (
        <div className="bento-card bg-brand-green/5 border-brand-green/20 space-y-3">
          <p className="text-[9px] font-mono font-bold tracking-widest text-brand-green uppercase">
            Why this matters
          </p>
          <p className="text-xs text-[#888888] font-sans leading-relaxed">
            Daily awareness of your local environment helps you make better decisions — from how you commute to what you eat. Small, consistent choices compound into real impact over time.
          </p>
        </div>
      )}
    </div>
  );
}
