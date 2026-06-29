import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Send, 
  Activity, 
  Mic, 
  Bot, 
  Zap 
} from "lucide-react";
import { speakRetro } from "../utils/voice";
import { CyberTask } from "../firebase";

interface GlitchTerminalProps {
  tasks: CyberTask[];
  panicState: "STANDARD" | "CRITICAL" | "NUCLEAR";
}

interface ChatMessage {
  id: string;
  sender: "USER" | "COMPANION";
  text: string;
  timestamp: string;
}

interface DiagnosisReport {
  overallStatus: string;
  criticalAdvice: string;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    urgency: string;
  }>;
}

export default function GlitchTerminal({ tasks, panicState }: GlitchTerminalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "COMPANION",
      text: "VECTORS ALIGNED. GREETINGS. FEED ME COMPLICATIONS, OR INITIATE RE-ASSESSMENT.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisReport | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isListeningSim, setIsListeningSim] = useState(false);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    handleRunDiagnosis();
  }, [tasks, panicState]);

  const handleRunDiagnosis = async () => {
    if (tasks.length === 0) {
      setDiagnosis(null);
      return;
    }
    
    setIsDiagnosing(true);
    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: tasks.map(t => ({
            title: t.title,
            deadline: t.deadline,
            impact: t.impact,
            procrastination: t.procrastination,
            status: t.status
          })),
          systemPanicState: panicState,
          actionType: "suggestions"
        })
      });

      const data = await res.json();
      if (data) {
        setDiagnosis({
          overallStatus: data.overallStatus || "WARNING",
          criticalAdvice: data.criticalAdvice || "PLANNING OVERLAYS GENERATED.",
          recommendations: data.recommendations || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "USER",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: query,
          systemPanicState: panicState,
          actionType: "chat"
        })
      });

      const data = await res.json();
      const replyText = data?.response || "I was unable to align the requested strategy. Let us retry.";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "COMPANION",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMsg]);
      speakRetro(replyText);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "COMPANION",
          text: "Communications delayed. Connection to core unstable.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const triggerCrisisQuick = (phrase: string) => {
    handleSendMessage(undefined, phrase);
  };

  const handleVoiceSim = () => {
    if (isListeningSim) {
      setIsListeningSim(false);
      return;
    }
    setIsListeningSim(true);
    speakRetro("VOICE RECEIVER STREAM: INGESTING COGNITIVE INPUT.");
    
    setTimeout(() => {
      const prompts = [
        "I have only one hour before my retrograde assignment!",
        "Immediate crisis: I am stuck and can't start this task!",
        "Emergency work overload. Help me find twenty minutes."
      ];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setInputText(randomPrompt);
      setIsListeningSim(false);
      speakRetro(`DETECTED CRITICAL VOCAL VECTOR: ${randomPrompt}`);
    }, 2000);
  };

  return (
    <section className="sleek-panel rounded-3xl p-6 flex flex-col h-full relative overflow-hidden">
      
      {/* Background soft magenta glow gradient corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="text-cyan-400" size={18} />
          <span>Interactive AI Copilot</span>
        </h2>
        <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-0.5 rounded-full font-bold">
          LIVE COMMS
        </span>
      </div>

      {/* Triage recommendations widget */}
      <div className="mb-4 bg-[#161B22] p-4 rounded-2xl border border-slate-800/80 relative z-10">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Activity className="text-pink-500 animate-pulse" size={14} />
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Diagnostic Advisor
            </span>
          </div>
          <button
            id="diagnose-trigger"
            onClick={handleRunDiagnosis}
            disabled={isDiagnosing}
            className="text-[10px] border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500 hover:text-white text-pink-400 font-bold px-2.5 py-1 rounded-lg transition-all"
          >
            {isDiagnosing ? "Analyzing..." : "Re-Assess State"}
          </button>
        </div>

        {isDiagnosing ? (
          <div className="text-xs text-slate-500 animate-pulse">
            Executing matrix diagnostics on active deadlines...
          </div>
        ) : diagnosis ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-pink-500 text-white px-2 py-0.5 rounded font-extrabold uppercase">
                {diagnosis.overallStatus}
              </span>
              <p className="text-xs text-slate-200 font-medium italic">
                "{diagnosis.criticalAdvice}"
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-800/60">
              {diagnosis.recommendations.map((rec, idx) => (
                <div 
                  key={rec.id || idx} 
                  className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-[#0A0C10] border border-slate-900"
                >
                  <span className="text-cyan-400 font-semibold">0{idx + 1}.</span>
                  <div className="flex-1">
                    <span className="font-bold text-slate-200">{rec.title}</span>
                    <span className="text-slate-400 block text-[10px] mt-0.5">{rec.description}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    rec.urgency === "CRITICAL" ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  }`}>
                    {rec.urgency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">
            No issues detected. Add a task to initialize the diagnostic advisor.
          </div>
        )}
      </div>

      {/* Dialog Area */}
      <div className="flex-1 overflow-y-auto border border-slate-800/80 bg-[#0A0C10]/60 rounded-2xl p-4 mb-4 h-64 space-y-3.5 relative z-10">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "USER" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-1">
              <span>{msg.sender === "USER" ? "You" : "Assistant"}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>
            <div 
              className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                msg.sender === "USER" 
                  ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-200 rounded-tr-none" 
                  : "border-indigo-500/20 bg-indigo-500/5 text-indigo-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-cyan-400 animate-pulse text-xs">
            <Bot size={14} className="animate-spin" />
            <span>Formulating time strategy...</span>
          </div>
        )}
        
        <div ref={consoleEndRef} />
      </div>

      {/* Preset Crisis Buttons */}
      <div className="mb-4 flex flex-wrap gap-2 text-[10px] relative z-10">
        <button
          id="trigger-procrastinating"
          onClick={() => triggerCrisisQuick("I'm severely procrastinating on a major assignment.")}
          className="bg-[#161B22] border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-all font-semibold"
        >
          // Overcome Procrastination
        </button>
        <button
          id="trigger-panic"
          onClick={() => triggerCrisisQuick("I have 2 hours left on my work, help!")}
          className="bg-[#161B22] border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:border-pink-500 hover:text-pink-400 transition-all font-semibold"
        >
          // 2-Hour Crisis Run
        </button>
        <button
          id="trigger-planning"
          onClick={() => triggerCrisisQuick("Help me plan my entire study weekend schedule.")}
          className="bg-[#161B22] border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg hover:border-indigo-500 hover:text-indigo-400 transition-all font-semibold"
        >
          // Build Weekend Blueprint
        </button>
      </div>

      {/* Chat inputs */}
      <form onSubmit={handleSendMessage} className="flex gap-2 relative z-10">
        <button
          type="button"
          id="voice-mic-trigger"
          onClick={handleVoiceSim}
          className={`border p-2.5 rounded-xl transition-all flex items-center justify-center ${
            isListeningSim 
              ? "border-pink-500 bg-pink-500/20 text-pink-400 animate-pulse" 
              : "border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-cyan-400"
          }`}
          title="Simulate Voice Input"
        >
          <Mic size={15} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI companion to arrange your day..."
          className="flex-1 bg-[#161B22] border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />

        <button
          type="submit"
          id="btn-terminal-send"
          className="bg-cyan-500 text-black hover:bg-cyan-400 p-2.5 rounded-xl transition-all flex items-center justify-center font-bold"
        >
          <Send size={15} />
        </button>
      </form>
    </section>
  );
}
