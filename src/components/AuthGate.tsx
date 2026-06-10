import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, User } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { Terminal, ArrowRight, RefreshCw } from "lucide-react";

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user") {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070708] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#070708] technical-grid relative flex items-center justify-center p-6 starfield overflow-hidden">
        <div className="scanline" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5e6bff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          {/* Header */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-2 text-brand-blue font-mono text-[11px] font-bold tracking-[0.25em] uppercase">
              <Terminal className="w-4 h-4" aria-hidden="true" />
              <span>Mission Authentication Required</span>
            </div>
            <h1 className="text-4xl font-display font-extrabold text-white uppercase tracking-tight leading-tight">
              Carbon<span className="text-brand-blue">Sense</span>
              <span className="text-brand-green">AI</span>
            </h1>
            <p className="text-[#c6c5d8] text-sm font-sans leading-relaxed">
              Monitor your carbon footprint, join climate challenges, and get AI-powered advice tailored to your location.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-[#1f2023] mb-6">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#8f8fa1] tracking-wider block uppercase">Tracking</span>
              <span className="text-sm font-mono text-white font-bold tracking-widest block mt-0.5">Active</span>
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-[#8f8fa1] tracking-wider block uppercase">AI Model</span>
              <span className="text-sm font-mono text-brand-blue font-bold tracking-widest block mt-0.5">Gemini</span>
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-[#8f8fa1] tracking-wider block uppercase">Status</span>
              <span className="text-sm font-mono text-brand-green font-bold tracking-widest flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse inline-block" />
                Online
              </span>
            </div>
          </div>

          {/* Sign-in card */}
          <div className="bg-[#101112]/90 border border-[#1f2023] rounded p-6 space-y-4">
            <div>
              <p className="text-xs font-mono font-bold text-[#888888] tracking-widest uppercase mb-1">Step 1 — Authenticate</p>
              <p className="text-sm text-white font-semibold">Sign in to access your mission control</p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              aria-label="Sign in with Google"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm py-3 px-4 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {signingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin text-gray-500" aria-hidden="true" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{signingIn ? "Authenticating..." : "Continue with Google"}</span>
              {!signingIn && <ArrowRight className="w-4 h-4 ml-auto" aria-hidden="true" />}
            </button>

            {error && (
              <p className="text-xs text-red-400 font-mono text-center">{error}</p>
            )}
          </div>

          <p className="text-[10px] text-[#555555] font-sans text-center mt-4">
            No data is sold or shared. Your footprint data stays private.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
