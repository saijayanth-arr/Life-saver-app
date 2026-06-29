import React, { useState, useEffect } from "react";
import { ShieldAlert, Volume2, VolumeX, Radio, Sparkles } from "lucide-react";
import { toggleVoiceMute, speakRetro, getVoiceMutedState } from "../utils/voice";

interface SystemHeaderProps {
  panicState: "STANDARD" | "CRITICAL" | "NUCLEAR";
  setPanicState: (state: "STANDARD" | "CRITICAL" | "NUCLEAR") => void;
  activeCount: number;
}

export default function SystemHeader({ panicState, setPanicState, activeCount }: SystemHeaderProps) {
  const [time, setTime] = useState(new Date());
  const [muted, setMuted] = useState(getVoiceMutedState());
  const [frequency, setFrequency] = useState("98.4 MHz");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const freqTimer = setInterval(() => {
      const f = (90 + Math.random() * 20).toFixed(1);
      setFrequency(`${f} MHz`);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(freqTimer);
    };
  }, []);

  const handleMuteToggle = () => {
    const isMuted = toggleVoiceMute();
    setMuted(isMuted);
    if (!isMuted) {
      speakRetro("VOICE SYNTHESIS DRIVER OVERRIDE: ACTIVATED.");
    }
  };

  const handlePanicChange = (state: "STANDARD" | "CRITICAL" | "NUCLEAR") => {
    setPanicState(state);
    if (state === "STANDARD") {
      speakRetro("PANIC CONTROL DAMPERS: ON.");
    } else if (state === "CRITICAL") {
      speakRetro("WARNING. CRITICAL VELOCITY DETECTED.");
    } else if (state === "NUCLEAR") {
      speakRetro("EXTREME SYSTEM TRAJECTORY. DECAY PROBABILITY INEVITABLE.");
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0D1117]/90 backdrop-blur-xl px-6 py-4 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 z-10 relative">
        
        {/* Title Block */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
              LifeSaver AI // Dynamic Triage
            </span>
          </div>
          <h1 
            id="app-title"
            className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2"
          >
            <span>LifeSaver</span>
            <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 italic">
            "I've rearranged your afternoon to save hours."
          </p>
        </div>

        {/* Real-time telemetry widgets */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Time widget */}
          <div className="bg-[#161B22] border border-slate-800 rounded-xl px-3 py-1.5 flex flex-col min-w-[110px]">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">// SYSTEM_TIME</span>
            <span className="font-mono text-xs text-slate-200">
              {time.toLocaleTimeString()}
            </span>
          </div>

          {/* Active exposure counter */}
          <div className="bg-[#161B22] border border-slate-800 rounded-xl px-3 py-1.5 flex flex-col min-w-[120px]">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">// EXPOSURE_STATUS</span>
            <span className="font-semibold text-xs text-pink-500 flex items-center gap-1">
              <ShieldAlert size={12} className="animate-pulse" />
              {activeCount} DECAYING
            </span>
          </div>

          {/* Panic Switch */}
          <div className="bg-[#161B22] border border-slate-800 rounded-xl p-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase px-1">PANIC_STATE:</span>
            <div className="flex bg-[#0A0C10] rounded-lg p-0.5 border border-slate-800">
              {(["STANDARD", "CRITICAL", "NUCLEAR"] as const).map((mode) => {
                const isActive = panicState === mode;
                const activeColor = 
                  mode === "STANDARD" ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" :
                  mode === "CRITICAL" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" :
                  "bg-pink-500 text-white animate-pulse shadow-lg shadow-pink-500/20";
                
                return (
                  <button
                    key={mode}
                    id={`panic-${mode.toLowerCase()}`}
                    onClick={() => handlePanicChange(mode)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isActive ? `${activeColor}` : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Driver Toggle */}
          <button
            id="voice-toggle"
            onClick={handleMuteToggle}
            className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              muted 
                ? "border-slate-800 text-slate-400 bg-slate-900/50" 
                : "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
            }`}
          >
            {muted ? (
              <>
                <VolumeX size={13} />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 size={13} className="animate-bounce" />
                <span>Voice Active</span>
              </>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
