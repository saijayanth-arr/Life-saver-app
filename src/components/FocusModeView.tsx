import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Clock, 
  Lock, 
  Unlock, 
  FileText, 
  Flame, 
  RefreshCw, 
  X, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Gamepad
} from "lucide-react";
import { CyberTask } from "../firebase";
import { speakRetro } from "../utils/voice";

interface FocusModeViewProps {
  task: CyberTask;
  onClose: () => void;
  panicState: "STANDARD" | "CRITICAL" | "NUCLEAR";
}

interface FocusIntel {
  motivation: string;
  distractionsToBlock: Array<{
    domain: string;
    app: string;
    reason: string;
  }>;
  contextualIntelligence: {
    recommendedOutline: string[];
    criticalQuestions: string[];
    suggestedTools: string[];
  };
}

export default function FocusModeView({ task, onClose, panicState }: FocusModeViewProps) {
  // Timer State
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [timerPreset, setTimerPreset] = useState<number>(25);

  // AI Firewall / Context state
  const [loadingIntel, setLoadingIntel] = useState(true);
  const [intel, setIntel] = useState<FocusIntel | null>(null);
  const [activeTab, setActiveTab] = useState<"OUTLINE" | "QUESTIONS" | "TOOLS">("OUTLINE");

  // Audio Synth State
  const [soundMode, setSoundMode] = useState<"OFF" | "REACTOR" | "BINAURAL" | "SHIELD">("REACTOR");
  const [volume, setVolume] = useState<number>(0.3);

  // Bypass / Unlock Defense state
  const [bypassInput, setBypassInput] = useState("");
  const [requiredKey, setRequiredKey] = useState("");
  const [showBypassConfirm, setShowBypassConfirm] = useState(false);
  const [bypassError, setBypassError] = useState(false);

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<any[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 1. Fetch AI Intelligence on startup
  useEffect(() => {
    speakRetro(`INITIATING COGNITIVE SECURE CHANNEL FOR: ${task.title}. DISTRACTION SHIELDS INJECTED.`);
    fetchFocusIntel();
    generateBypassKey();

    return () => {
      stopAllSounds();
    };
  }, [task]);

  // Audio Synthesis Control
  useEffect(() => {
    if (soundMode === "OFF") {
      stopAllSounds();
    } else {
      initAndPlaySound();
    }
  }, [soundMode]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  const generateBypassKey = () => {
    const segments = ["BYPASS", "DECRYPT", "OVERRIDE", "FORCE", "TERMINATE"];
    const randomSeg = segments[Math.floor(Math.random() * segments.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setRequiredKey(`${randomSeg}_SYS_${num}`);
  };

  const fetchFocusIntel = async () => {
    setLoadingIntel(true);
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          systemPanicState: panicState,
          actionType: "focus"
        })
      });
      const data = await res.json();
      if (data) {
        setIntel(data);
      }
    } catch (e) {
      console.error("Failed to load Focus Mode AI recommendations:", e);
    } finally {
      setLoadingIntel(false);
    }
  };

  // 2. Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      speakRetro(`FOCUS MISSION COMPLETE. TASK ${task.title} SECURED. IMMUNE SHIELDS DISSOLVING.`);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const handlePresetChange = (mins: number) => {
    setTimerPreset(mins);
    setTotalSeconds(mins * 60);
    setSecondsLeft(mins * 60);
    setIsActive(false);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    speakRetro(isActive ? "COGNITIVE SPEED COUNTER: SUSPENDED." : "COUNTDOWN SEQUENCE: ENGAGED.");
  };

  const resetTimer = () => {
    setSecondsLeft(totalSeconds);
    setIsActive(false);
  };

  // 3. Synth Music Engine
  const stopAllSounds = () => {
    sourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    });
    sourcesRef.current = [];
  };

  const initAndPlaySound = () => {
    try {
      stopAllSounds();

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Setup overall gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (soundMode === "REACTOR") {
        // Create 2 sine oscillators detuned to produce a deep, beating binaural drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const lpFilter = ctx.createBiquadFilter();

        osc1.type = "sine";
        osc1.frequency.value = 85; // 85Hz deep bass hum

        osc2.type = "sawtooth"; // adds some rich harmonics
        osc2.frequency.value = 85.5; // slow beats

        lpFilter.type = "lowpass";
        lpFilter.frequency.value = 110; // filter out harsh buzz

        osc1.connect(lpFilter);
        osc2.connect(lpFilter);
        lpFilter.connect(masterGain);

        osc1.start();
        osc2.start();

        sourcesRef.current.push(osc1, osc2);
      } else if (soundMode === "BINAURAL") {
        // True stereo binaural beats: 100Hz in left ear, 106Hz in right ear
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        oscLeft.type = "sine";
        oscLeft.frequency.value = 120; // Carrier freq

        oscRight.type = "sine";
        oscRight.frequency.value = 126; // 6Hz Theta entrainment beat

        if (pannerLeft && pannerRight) {
          pannerLeft.pan.value = -1; // far left
          pannerRight.pan.value = 1; // far right

          oscLeft.connect(pannerLeft);
          pannerLeft.connect(masterGain);

          oscRight.connect(pannerRight);
          pannerRight.connect(masterGain);
        } else {
          // Fallback if pan is unsupported
          oscLeft.connect(masterGain);
          oscRight.connect(masterGain);
        }

        oscLeft.start();
        oscRight.start();

        sourcesRef.current.push(oscLeft, oscRight);
      } else if (soundMode === "SHIELD") {
        // Generate continuous white noise buffer
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoiseSource = ctx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;

        // Bandpass filter white noise to sound like a gentle protective ocean hiss
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 600;
        bandpass.Q.value = 1.0;

        whiteNoiseSource.connect(bandpass);
        bandpass.connect(masterGain);

        whiteNoiseSource.start();
        sourcesRef.current.push(whiteNoiseSource);
      }
    } catch (e) {
      console.warn("Speech/AudioContext initialize blocked by browser autoplay rules:", e);
    }
  };

  const handleEscapeAttempt = () => {
    setShowBypassConfirm(true);
    setBypassInput("");
    setBypassError(false);
    speakRetro("ESCAPE DEFENSE PROTOCOL DETECTED. AUTHORIZE ESCAPE KEY TO DISENGAGE BLOCKERS.");
  };

  const handleVerifyBypass = () => {
    if (bypassInput.trim() === requiredKey) {
      stopAllSounds();
      speakRetro("DECRYPTION APPROVED. FOCUS MODE SHIELDS DISMANTLED.");
      onClose();
    } else {
      setBypassError(true);
      setBypassInput("");
      speakRetro("DECRYPTION FAILED. SYSTEM SHIELD INTEGRITY MAINTAINED.");
    }
  };

  // Calculations for progress rings
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (secondsLeft / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0C10] flex flex-col font-mono text-xs select-none">
      
      {/* Glitch Grid Canvas Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,36,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none z-40 opacity-70"></div>
      
      {/* Glowing Neon ambient corner spots */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"></div>

      {/* IMMERSIVE TOP SECURITY TELEMETRY BAR */}
      <div className="border-b border-pink-500/40 bg-black/80 px-6 py-4 flex items-center justify-between z-10 sticky top-0 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
          <div>
            <h1 className="text-sm font-bold text-pink-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={14} className="animate-pulse" />
              <span>ACTIVE DISTRACTION FIREWALL OVERLAY // ON</span>
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold uppercase mt-0.5 tracking-wider">
              ISOLATION MATRIX: {task.title}
            </p>
          </div>
        </div>

        <button
          onClick={handleEscapeAttempt}
          className="border border-pink-500/50 bg-pink-500/10 hover:bg-pink-500 hover:text-black font-extrabold px-4 py-2 rounded text-[11px] uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(236,72,153,0.3)]"
        >
          [ ESCAPE ISOLATION ]
        </button>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* LEFT COLUMN: FOCUS TIMER & FIREWALL BLOCKED LIST (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* TIMER DECK CARD */}
          <div className="border border-cyan-500/30 bg-[#0D1117]/80 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute top-2 right-3 font-mono text-[9px] text-cyan-500/60 uppercase">
              // CHRONO_DYNAMICS
            </div>

            {/* Presets selectors */}
            <div className="flex bg-[#0A0C10] rounded-lg p-0.5 border border-cyan-500/20 mb-6 z-10">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handlePresetChange(mins)}
                  className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all ${
                    timerPreset === mins 
                      ? "bg-cyan-500 text-black shadow-lg" 
                      : "text-slate-400 hover:text-cyan-400"
                  }`}
                >
                  {mins} MINS
                </button>
              ))}
            </div>

            {/* Circular Graphic or Countdown text */}
            <div className="relative flex items-center justify-center w-64 h-64 mb-6">
              
              {/* Outer Cyan Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="#1E293B"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="#06B6D4"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="691"
                  strokeDashoffset={691 - (691 * progressPercentage) / 100}
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Inside details */}
              <div className="text-center z-10">
                <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider block mb-1">
                  SECURE SECONDS
                </span>
                <h2 className="text-5xl font-extrabold text-white tracking-tight font-mono select-all select-none animate-pulse">
                  {formatTime(secondsLeft)}
                </h2>
                <span className="text-[10px] text-slate-500 uppercase block mt-1.5 font-bold">
                  {isActive ? "SHIELDS FULLY CHARGING" : "SHIELDS DEACTIVATED"}
                </span>
              </div>
            </div>

            {/* Command Trigger Controls */}
            <div className="flex gap-4 z-10 w-full max-w-sm">
              <button
                onClick={toggleTimer}
                className={`flex-1 font-bold py-3.5 rounded-xl uppercase tracking-wider transition-all text-xs border ${
                  isActive 
                    ? "border-pink-500/50 bg-pink-500/10 text-pink-400 hover:bg-pink-500 hover:text-black" 
                    : "border-cyan-500 bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                }`}
              >
                {isActive ? "PAUSE COUNTER" : "INITIATE FOCUS"}
              </button>
              <button
                onClick={resetTimer}
                className="border border-slate-800 bg-[#0A0C10] text-slate-400 hover:text-white hover:border-slate-700 px-5 rounded-xl transition-all font-semibold"
              >
                RESET
              </button>
            </div>
          </div>

          {/* DISTRACTION FIREWALL STATUS BOX */}
          <div className="border border-pink-500/30 bg-[#0D1117]/80 rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-pink-500/20 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="text-pink-500 animate-pulse" size={15} />
                  <span className="font-bold text-pink-400 uppercase tracking-widest">
                    AI INTELLIGENT BLOCKLIST (FIREWALL STATUS)
                  </span>
                </div>
                <span className="text-[10px] bg-pink-500/15 border border-pink-500/30 text-pink-400 px-2.5 py-0.5 rounded uppercase font-extrabold animate-pulse">
                  BLACK HOLE ACTIVE
                </span>
              </div>

              {loadingIntel ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={24} className="animate-spin text-pink-500" />
                  <span className="uppercase text-[10px] font-bold tracking-widest text-pink-400 animate-pulse">
                    INTELLIGENT DISTRACTION SCANNER IN PROGRESS...
                  </span>
                </div>
              ) : intel ? (
                <div className="space-y-3.5">
                  <div className="p-3 bg-pink-500/5 border border-pink-500/10 rounded-xl text-pink-300 italic mb-2 leading-relaxed">
                    "AI DIRECTIVE: {intel.motivation}"
                  </div>

                  {intel.distractionsToBlock.map((dist, idx) => (
                    <div 
                      key={idx} 
                      className="border border-pink-500/10 bg-black/60 p-3 rounded-xl flex items-start gap-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-8 h-8 bg-pink-500/5 -skew-x-12 translate-x-2 -translate-y-1"></div>
                      <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 border border-pink-500/30 w-5 h-5 flex items-center justify-center rounded">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-xs">{dist.app}</span>
                          <span className="text-[10px] text-pink-500 font-mono tracking-wider">({dist.domain})</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                          {dist.reason}
                        </p>
                      </div>
                      <span className="text-pink-500 bg-pink-500/10 border border-pink-500/20 p-1.5 rounded-lg">
                        <Lock size={12} className="animate-pulse" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 uppercase">
                  [ System failed to scan for customized blocklist. Standard firewall active. ]
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-[#0A0C10] border border-pink-500/10 rounded-xl text-slate-500 text-[10px] leading-relaxed flex items-center gap-2">
              <AlertTriangle className="text-pink-500 shrink-0" size={14} />
              <span>ANY ROUTING OR RESOLUTION TO OUTSIDE SOCIAL HUBS OR NETWORKS DETECTED DURING FOCUS WINDOW WILL INITIATE SCREEN STATIC ALERTS.</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI CONTEXTUAL STUDY INTEL & RETRO SYNTH (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* AI FOCUS INTEL CARD */}
          <div className="border border-cyan-500/30 bg-[#0D1117]/80 rounded-2xl p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3 mb-4">
              <FileText className="text-cyan-400" size={16} />
              <span className="font-bold text-cyan-400 uppercase tracking-widest">
                AI CONTEXTUAL INTEL GENERATOR
              </span>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex border border-cyan-500/20 bg-black rounded-xl p-1 gap-1 mb-4 text-[10px] font-bold">
              {(["OUTLINE", "QUESTIONS", "TOOLS"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg uppercase tracking-wider text-center transition-all ${
                    activeTab === tab 
                      ? "bg-cyan-500 text-black font-extrabold" 
                      : "text-slate-400 hover:text-cyan-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB VIEWPORTS */}
            <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-3 font-mono text-[11px] leading-relaxed">
              {loadingIntel ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-cyan-400" />
                  <span className="uppercase text-[9px] font-bold tracking-widest animate-pulse">
                    GENERATING SPECIFIC DISCOVERY MATRICES...
                  </span>
                </div>
              ) : intel ? (
                <>
                  {activeTab === "OUTLINE" && (
                    <div className="space-y-2.5">
                      {intel.contextualIntelligence.recommendedOutline.map((step, index) => (
                        <div key={index} className="flex gap-2.5 items-start p-2 rounded-xl bg-black/40 border border-slate-900">
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-cyan-500/25">
                            P{index + 1}
                          </span>
                          <span className="text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "QUESTIONS" && (
                    <div className="space-y-2.5">
                      {intel.contextualIntelligence.criticalQuestions.map((q, index) => (
                        <div key={index} className="flex gap-2.5 items-start p-2 rounded-xl bg-black/40 border border-slate-900">
                          <span className="text-pink-500 font-bold shrink-0">?</span>
                          <span className="text-slate-300 italic">"{q}"</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "TOOLS" && (
                    <div className="space-y-2.5">
                      {intel.contextualIntelligence.suggestedTools.map((t, index) => (
                        <div key={index} className="flex gap-2.5 items-start p-2 rounded-xl bg-black/40 border border-slate-900">
                          <ChevronRight className="text-cyan-400 shrink-0 mt-0.5" size={12} />
                          <span className="text-slate-300 font-medium">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-500 uppercase py-6">
                  [ Context details unavailable. Continue core work independently. ]
                </div>
              )}
            </div>
          </div>

          {/* AMBIENT focus SYNTH PANEL */}
          <div className="border border-cyan-500/30 bg-[#0D1117]/80 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-2 right-3 font-mono text-[9px] text-cyan-500/60 uppercase">
              // NOISE_SYNTH_DRV
            </div>

            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3">
              <Volume2 className="text-cyan-400" size={15} />
              <span className="font-bold text-cyan-400 uppercase tracking-widest">
                AMBIENT FOCUS SOUND DRIVER
              </span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold uppercase">
              {[
                { mode: "OFF", label: "MUTE SOUND" },
                { mode: "REACTOR", label: "REACTOR DRONE" },
                { mode: "BINAURAL", label: "THETA BINAURAL" },
                { mode: "SHIELD", label: "WHITE NOISE" }
              ].map((item) => (
                <button
                  key={item.mode}
                  onClick={() => setSoundMode(item.mode as any)}
                  className={`py-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                    soundMode === item.mode 
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]" 
                      : "border-slate-800 bg-[#0A0C10] text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30"
                  }`}
                >
                  {soundMode === item.mode && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Volume controls */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>VOL_GAIN: {Math.round(volume * 100)}%</span>
                <span>DECAY: LINEAR</span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX size={12} className="text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-cyan-500 bg-[#0A0C10] h-1.5 rounded-full appearance-none border border-slate-900 cursor-pointer"
                />
                <Volume2 size={12} className="text-cyan-400" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BYPASS CONFIRMATION SCREEN OVERLAY (ESCAPE PROTECTION) */}
      <AnimatePresence>
        {showBypassConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0C10]/95 flex items-center justify-center p-4 z-50 overflow-hidden"
          >
            {/* Screen static tearing effect background inside bypass */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="border border-pink-500/60 bg-black/90 p-8 rounded-2xl max-w-md w-full relative overflow-hidden text-center shadow-[0_0_30px_rgba(236,72,153,0.2)]"
            >
              <div className="absolute top-2 right-3 font-mono text-[8px] text-pink-500/50 uppercase">
                // ESC_ALERTER
              </div>

              <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500 animate-bounce">
                <AlertTriangle size={24} />
              </div>

              <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">
                WARNING: ESCAPE DEFENSE SYSTEM TRIPPED
              </h3>
              <p className="text-slate-400 text-[11px] mb-5 leading-relaxed">
                Leaving focus mode blocks active cognitive momentum. To override and dismantle the distraction firewall, you must solve the system verification.
              </p>

              {/* Required Unlock Code Display */}
              <div className="p-3 bg-pink-500/5 border border-dashed border-pink-500/30 rounded-xl mb-5 text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">
                  ENTER THIS COGNITIVE DECRYPT KEY:
                </span>
                <span className="text-base font-extrabold text-pink-400 select-all font-mono tracking-wider animate-pulse">
                  {requiredKey}
                </span>
              </div>

              {/* Code Inputs */}
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="TYPE VERIFICATION KEY..."
                  value={bypassInput}
                  onChange={(e) => {
                    setBypassInput(e.target.value.toUpperCase());
                    setBypassError(false);
                  }}
                  className="w-full bg-[#161B22] border border-pink-500/30 rounded-xl text-center font-extrabold text-pink-400 p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 font-mono tracking-widest text-xs"
                />

                {bypassError && (
                  <div className="text-[10px] text-pink-500 font-bold uppercase animate-shake">
                    *** VERIFICATION MISMATCH. SHELLS IMMUNE. ***
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyBypass}
                    className="flex-1 bg-pink-500 text-white hover:bg-pink-400 font-bold py-3 rounded-xl uppercase text-[10px] tracking-wider transition-all"
                  >
                    [ DISENGAGE WALLS ]
                  </button>
                  <button
                    onClick={() => {
                      setShowBypassConfirm(false);
                      speakRetro("ESCAPE STAND-DOWN COMPLETE. SHIELD RETRACTED.");
                    }}
                    className="border border-slate-800 bg-[#0A0C10] text-slate-400 hover:text-white hover:border-slate-700 px-5 rounded-xl transition-all font-bold text-[10px]"
                  >
                    RETURN
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
