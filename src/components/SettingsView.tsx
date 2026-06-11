import { useState, useEffect } from "react";
import { Shield, Sliders, Save, Trash2, Cpu, Check } from "lucide-react";

interface SettingsProps {
  onReset: () => void;
}

export default function SettingsView({ onReset }: SettingsProps) {
  const [safetyThreshold, setSafetyThreshold] = useState(5.1);
  const [scrubberEfficiency, setScrubberEfficiency] = useState(85);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.safetyThreshold !== undefined) setSafetyThreshold(data.safetyThreshold);
        if (data.scrubberEfficiency !== undefined) setScrubberEfficiency(data.scrubberEfficiency);
        if (data.audioFeedback !== undefined) setAudioFeedback(data.audioFeedback);
      })
      .catch(() => {/* keep defaults on error */});
  }, []);

  const handleSave = async () => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ safetyThreshold, scrubberEfficiency, audioFeedback }),
      });
      setStatusMessage("Settings saved ✓");
    } catch {
      setStatusMessage("Save failed — check connection");
    }
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-4">
        <h2 className="text-xl font-display font-extrabold text-brand-blue uppercase tracking-wide">
          Settings
        </h2>
        <span className="text-[10px] font-mono bg-brand-blue/10 border border-brand-blue/20 text-brand-blue px-2 py-0.5 rounded tracking-widest font-bold">
          LOCAL_SANDBOX
        </span>
      </div>
      <p className="text-xs text-[#888888] -mt-4">
        Adjust your regional targets, efficiency assumptions, notifications, and data preferences.
      </p>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Calibration Parameters */}
        <div className="lg:col-span-8 bento-card space-y-6">
          <div className="flex items-center gap-2 border-b border-brand-border pb-4">
            <Sliders className="w-4 h-4 text-brand-blue" aria-hidden="true" />
            <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              Calibration
            </h3>
          </div>

          {/* Slider 1: Target limit threshold */}
          <div className="space-y-3">
            <div className="flex justify-between font-mono text-xs">
              <span id="safetyThreshold-label" className="text-[#888888] font-bold">Regional Target Limit (tonnes CO₂e)</span>
              <span className="text-brand-blue font-bold" aria-live="polite">{safetyThreshold}t</span>
            </div>
            <input
              type="range"
              aria-labelledby="safetyThreshold-label"
              aria-valuenow={safetyThreshold}
              aria-valuemin={3.0}
              aria-valuemax={9.0}
              min="3.0"
              max="9.0"
              step="0.1"
              value={safetyThreshold}
              onChange={(e) => setSafetyThreshold(Number(e.target.value))}
              className="w-full h-1 bg-brand-black rounded-lg cursor-pointer accent-brand-blue"
            />
            <p className="text-[10px] text-[#888888] font-mono leading-relaxed">
              Base threshold rating for triggering Sector Bravo automated carbon overage alarms.
            </p>
          </div>

          {/* Slider 2: Scrubber threshold */}
          <div className="space-y-3 pt-4 border-t border-brand-border">
            <div className="flex justify-between font-mono text-xs">
              <span id="scrubberEfficiency-label" className="text-[#888888] font-bold">Carbon Capture Efficiency</span>
              <span className="text-brand-green font-bold" aria-live="polite">{scrubberEfficiency}%</span>
            </div>
            <input
              type="range"
              aria-labelledby="scrubberEfficiency-label"
              aria-valuenow={scrubberEfficiency}
              aria-valuemin={50}
              aria-valuemax={100}
              min="50"
              max="100"
              step="5"
              value={scrubberEfficiency}
              onChange={(e) => setScrubberEfficiency(Number(e.target.value))}
              className="w-full h-1 bg-brand-black rounded-lg cursor-pointer accent-brand-green"
            />
            <p className="text-[10px] text-[#888888] font-mono leading-relaxed">
              Assumed mechanical mitigation rates of advanced carbon-capture elements on Urban Refit arrays.
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="pt-6 border-t border-brand-border space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="space-y-1">
                <p className="text-[#888888] font-bold">Audio Alerts</p>
                <p className="text-[10px] text-[#888888]">
                  Enable audio notifications when you exceed your carbon target.
                </p>
              </div>
              <input
                type="checkbox"
                aria-label="Enable audio alerts"
                checked={audioFeedback}
                onChange={(e) => setAudioFeedback(e.target.checked)}
                className="rounded border-brand-border text-brand-blue h-4.5 w-4.5 bg-brand-black focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-brand-border flex justify-between items-center gap-4">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-linear-to-r from-brand-blue to-[#0066ff] hover:opacity-90 active:scale-95 text-brand-black font-mono text-[10px] font-extrabold tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(0,242,255,0.2)]"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Save Settings</span>
            </button>

            {statusMessage && (
              <p className="text-xs font-mono text-brand-green font-bold animate-fade-in flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                {statusMessage}
              </p>
            )}
          </div>
        </div>

        {/* Security & System Operations panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bento-card space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-border pb-3">
              <Shield className="w-4 h-4 text-red-500" aria-hidden="true" />
              <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase">
                Data &amp; Privacy
              </h3>
            </div>

            <p className="text-xs text-[#888888] leading-relaxed font-sans">
              Your data is stored locally. Erasing it is permanent and cannot be undone.
            </p>

            <button
              onClick={onReset}
              className="w-full py-2.5 bg-red-950/20 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-500 font-mono text-[10px] font-bold tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
              <span>Erase All My Data</span>
            </button>
          </div>

          <div className="bento-card space-y-3 font-mono text-[11px] text-[#888888] leading-relaxed">
            <div className="flex items-center gap-2 text-brand-blue font-bold border-b border-brand-border pb-2">
              <Cpu className="w-4 h-4 text-brand-blue" aria-hidden="true" />
              <span>System Info</span>
            </div>
            <p><strong>CORE VM:</strong> CLOUDRUN_NODE_EAST</p>
            <p><strong>PORT:</strong> 3000 (INGRESS SAFE)</p>
            <p><strong>REVERSE PROXY:</strong> NGINX HIGH PERFORMANCE</p>
            <p><strong>INTEGRATION API:</strong> ENABLED (GEMINI-2.0-FLASH)</p>
          </div>
        </div>
        
      </section>
    </div>
  );
}
