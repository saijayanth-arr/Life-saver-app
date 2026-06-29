import React, { useState, useEffect, useRef } from "react";
import { 
  subscribeTasks, 
  subscribeHabits, 
  subscribeGoals, 
  CyberTask, 
  CyberHabit, 
  CyberGoal,
  saveTask,
  deleteTask,
  saveHabit,
  deleteHabit,
  saveGoal,
  deleteGoal
} from "./firebase";
import FocusModeView from "./components/FocusModeView";
import { speakRetro } from "./utils/voice";
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Activity, 
  Search, 
  Lock, 
  Unlock, 
  Flame, 
  Trophy, 
  CheckSquare, 
  Trash2, 
  Plus, 
  Sparkles, 
  User, 
  Clock, 
  TrendingUp, 
  Mic, 
  MicOff, 
  Bot, 
  Send, 
  HelpCircle, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Calendar,
  Layers,
  Sparkle
} from "lucide-react";

interface QuickReminder {
  id: string;
  title: string;
  secondsLeft: number;
  initialMinutes: number;
}

interface ChatMessage {
  id: string;
  sender: "USER" | "COMPANION";
  text: string;
  timestamp: string;
}

interface PerformanceIns {
  terminalTitle: string;
  overallStatus: string;
  criticalAdvice: string;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    urgency: string;
  }>;
}

interface CyberCheckboxProps {
  checked: boolean;
  onChange?: () => void;
  label?: string;
  variant?: "cyan" | "magenta" | "emerald";
}

function CyberCheckbox({ checked, onChange, label, variant = "cyan" }: CyberCheckboxProps) {
  const primaryColor = variant === "cyan" 
    ? "border-cyan-400 text-cyan-400" 
    : variant === "emerald" 
      ? "border-emerald-400 text-emerald-400" 
      : "border-pink-500 text-pink-500";
  const hoverColor = variant === "cyan" ? "group-hover:border-pink-500" : "group-hover:border-cyan-400";
  const glowColor = variant === "cyan" 
    ? "shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
    : variant === "emerald" 
      ? "shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
      : "shadow-[0_0_8px_rgba(236,72,153,0.6)]";
  
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={!onChange}
      className={`group relative flex items-center justify-center select-none ${onChange ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
    >
      {/* Glitch Offset Chromatic Layer */}
      <span 
        className="absolute inset-0 border border-pink-500/60 translate-x-[1px] translate-y-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
      ></span>
      
      {/* Main Checkbox Cut Container */}
      <span 
        className={`relative w-5 h-5 flex items-center justify-center border-2 bg-black/90 transition-all duration-150 ${primaryColor} ${hoverColor} ${checked ? glowColor : ""}`}
        style={{ clipPath: "polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)" }}
      >
        {checked && (
          <span 
            className="w-2.5 h-2.5 bg-pink-500 shadow-[0_0_4px_#ec4899] animate-pulse"
            style={{ clipPath: "polygon(2px 0, 100% 0, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0 100%, 0 2px)" }}
          ></span>
        )}
      </span>
      {label && <span className="ml-2 font-mono text-[10px] tracking-wider uppercase">{label}</span>}
    </button>
  );
}

export default function App() {
  // Authentication & Profile States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState("alex.mercer@gmail.com");
  const [authPassword, setAuthPassword] = useState("password123");
  const [userXp, setUserXp] = useState(120);
  const [userLevel, setUserLevel] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Firestore Core States
  const [tasks, setTasks] = useState<CyberTask[]>([]);
  const [habits, setHabits] = useState<CyberHabit[]>([]);
  const [goals, setGoals] = useState<CyberGoal[]>([]);
  const [panicState, setPanicState] = useState<"STANDARD" | "CRITICAL" | "NUCLEAR">("STANDARD");
  
  // Dashboard Telemetry and search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBoardFilter, setActiveBoardFilter] = useState<"ALL" | "CRITICAL" | "TODAY" | "COMPLETED">("ALL");
  const [activeChartTab, setActiveChartTab] = useState<"COMPLETIONS" | "PANIC" | "HOURS">("COMPLETIONS");

  // Subtask loading indicator
  const [loadingStepsId, setLoadingStepsId] = useState<string | null>(null);

  // Expansions & Drawer states
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Task creation Form inputs
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskImportance, setNewTaskImportance] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newTaskProcrastination, setNewTaskProcrastination] = useState<"SEVERE" | "HIGH" | "AVERAGE" | "LOW">("AVERAGE");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState("1.0");
  const [newTaskCategory, setNewTaskCategory] = useState("Study");

  // Quick Reminders countdowns state
  const [reminders, setReminders] = useState<QuickReminder[]>([
    { id: "rem-1", title: "HYDRATION CYCLE", secondsLeft: 300, initialMinutes: 5 },
    { id: "rem-2", title: "STAND UP & ROTATE JOINTS", secondsLeft: 900, initialMinutes: 15 }
  ]);
  const [remTitleInput, setRemTitleInput] = useState("");
  const [remMinsInput, setRemMinsInput] = useState("5");

  // Quests list state
  const [quests, setQuests] = useState([
    { id: "quest-1", title: "SECURE 1 CRITICAL DEADLINE", xp: 100, completed: false },
    { id: "quest-2", title: "CHECK OFF 2 RECURRING HABITS", xp: 50, completed: false },
    { id: "quest-3", title: "RUN POMODORO FOCUS PROFILES", xp: 75, completed: false }
  ]);

  // Badges list state
  const [badges, setBadges] = useState([
    { id: "badge-1", label: "Alpha Saver", desc: "No critical delays allowed", unlocked: true },
    { id: "badge-2", label: "Matrix Drone", desc: "Focus continuously for 45 mins", unlocked: true },
    { id: "badge-3", label: "Streak Master", desc: "Keep 5 day habits active", unlocked: false },
    { id: "badge-4", label: "Immune System", desc: "Zero procrastination blocks", unlocked: false }
  ]);

  // AI Insights Box & chatbot status
  const [aiDiagnostic, setAiDiagnostic] = useState<PerformanceIns | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [voiceActive, setVoiceActive] = useState(true);
  const [voiceIndicatorMsg, setVoiceIndicatorMsg] = useState("Aero voice synthesizer ready");

  // Chat Console States
  const [chatFeed, setChatFeed] = useState<ChatMessage[]>([
    {
      id: "bot-init",
      sender: "COMPANION",
      text: "VECTORS ALIGNED. GREETINGS ALEX. ENTER COGNITIVE CODES, OR COMMAND SCHEDULING.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [micListening, setMicListening] = useState(false);

  // Active Overlays (Focus Mode, Study Coach side drawer, Alarm Trigger)
  const [activeFocusTask, setActiveFocusTask] = useState<CyberTask | null>(null);
  const [studyCoachTask, setStudyCoachTask] = useState<CyberTask | null>(null);
  const [triggeredAlarm, setTriggeredAlarm] = useState<QuickReminder | null>(null);

  // Habit Addition inputs
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitFreq, setNewHabitFreq] = useState<"DAILY" | "WEEKLY">("DAILY");

  // System Log Stream
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "INITIALIZING LIFESAVER SYSTEM...",
    "COGNITIVE DECAY DAMPENERS INSTALLED.",
    "AERO FIREWALL: STANDING BY."
  ]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 12)]);
  };

  // 1. Core Firebase subscription hooks
  useEffect(() => {
    const unsubTasks = subscribeTasks((updatedTasks) => {
      setTasks(updatedTasks);
      addLog(`Synchronized ${updatedTasks.length} deadlines.`);
    });

    const unsubHabits = subscribeHabits((updatedHabits) => {
      setHabits(updatedHabits);
      addLog(`Synchronized ${updatedHabits.length} daily habits.`);
    });

    const unsubGoals = subscribeGoals((updatedGoals) => {
      setGoals(updatedGoals);
      addLog(`Synchronized ${updatedGoals.length} strategic goals.`);
    });

    return () => {
      unsubTasks();
      unsubHabits();
      unsubGoals();
    };
  }, []);

  // 2. Real-time countdown clock ticks for reminders
  useEffect(() => {
    const timer = setInterval(() => {
      setReminders(prev => {
        return prev.map(rem => {
          if (rem.secondsLeft <= 1) {
            if (rem.secondsLeft === 1) {
              setTriggeredAlarm(rem);
              speakRetro(`ALERT. TIMER FOR ${rem.title} HAS EXPIRED. RETRO FIREWALL DISSOLVED.`);
            }
            return { ...rem, secondsLeft: 0 };
          }
          return { ...rem, secondsLeft: rem.secondsLeft - 1 };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 3. AI Performance Diagnostics fetch on task update
  useEffect(() => {
    if (tasks.length > 0) {
      fetchAiSuggestions();
    }
  }, [tasks, panicState]);

  const fetchAiSuggestions = async () => {
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
            status: t.status,
            category: t.category
          })),
          systemPanicState: panicState,
          actionType: "suggestions"
        })
      });
      const data = await res.json();
      if (data) {
        setAiDiagnostic({
          terminalTitle: data.terminalTitle || "AERO SYSTEM DIAGNOSIS",
          overallStatus: data.overallStatus || "WARNING",
          criticalAdvice: data.criticalAdvice || "PLANNING OVERLAYS ACTIVE.",
          recommendations: data.recommendations || []
        });
      }
    } catch (e) {
      console.warn("AI Diagnostics failed:", e);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Auth Submit Action
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    speakRetro("AERO INTERFACE BOOTED. ALEX MERCER AUTHORIZED. DECRYPTING TIME COMMITMENTS.");
    addLog("USER ALEX.MERCER@GMAIL.COM LINKED SECURELY.");
  };

  // Google Sign In trigger
  const handleGoogleSignIn = () => {
    setIsAuthenticated(true);
    speakRetro("GOOGLE FEDERATION SECURED. ALEX MERCER GUEST STATUS ACTIVATED.");
    addLog("OAUTH FEDERATION ESTABLISHED.");
  };

  // Add custom habit loop
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    try {
      const h: Omit<CyberHabit, "id"> = {
        title: newHabitTitle.toUpperCase(),
        frequency: newHabitFreq,
        streak: 0,
        status: "ACTIVE"
      };
      await saveHabit(h);
      setNewHabitTitle("");
      speakRetro(`HABIT CYCLE ENGAGED: ${h.title}`);
      addLog(`HABIT ADDED: ${h.title}`);
      addXp(40);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteHabit = async (habit: CyberHabit) => {
    const today = new Date().toISOString().split("T")[0];
    if (habit.lastCompleted === today) return;

    try {
      await saveHabit({
        ...habit,
        streak: habit.streak + 1,
        lastCompleted: today
      });
      speakRetro(`RE-ENFORCING HABIT LOOP. STREAK: ${habit.streak + 1}.`);
      addLog(`COMPLETED HABIT: ${habit.title}`);
      addXp(30);

      // check quest check off
      updateQuest("quest-2");
    } catch (e) {
      console.error(e);
    }
  };

  // XP addition algorithm with levels
  const addXp = (amount: number) => {
    setUserXp(prev => {
      const total = prev + amount;
      if (total >= 500) {
        setUserLevel(l => l + 1);
        speakRetro("CONGRATULATIONS PILOT. YOUR TIME EFFICIENCY INDEX HAS CRITICAL-LEVELLED UP.");
        addLog(`LEVEL UP! CURRENT INTEL LEVEL: ${userLevel + 1}`);
        return total - 500;
      }
      return total;
    });
  };

  const updateQuest = (id: string) => {
    setQuests(prev => prev.map(q => {
      if (q.id === id && !q.completed) {
        addXp(q.xp);
        speakRetro(`DAILY QUEST SECURED: ${q.title}. REWARDING ${q.xp} EXPERIENCE UNITS.`);
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  // Add custom deadlines task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDeadline) return;

    try {
      const durationNum = parseFloat(newTaskDuration) || 1.0;
      const t: Omit<CyberTask, "id"> = {
        title: newTaskTitle.toUpperCase(),
        description: newTaskDescription,
        deadline: newTaskDeadline,
        impact: newTaskImportance,
        procrastination: newTaskProcrastination,
        status: "PENDING",
        category: newTaskCategory,
        createdAt: new Date().toISOString(),
        substeps: []
      };

      await saveTask(t);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDeadline("");
      setIsTaskFormOpen(false);
      speakRetro(`VECTORED COMMITMENT ACQUIRED: ${t.title}`);
      addLog(`COMMITMENT ACQUIRED: ${t.title}`);
      addXp(60);
    } catch (e) {
      console.error(e);
      speakRetro("TRANSMISSION FAILURE: DATA CORRUPT.");
    }
  };

  const handleToggleTaskComplete = async (task: CyberTask) => {
    const isNowComplete = task.status === "COMPLETED";
    const nextStatus = isNowComplete ? "PENDING" : "COMPLETED";

    try {
      await saveTask({
        ...task,
        status: nextStatus
      });
      speakRetro(isNowComplete ? "DEADLINE RE-OPENED." : "DEADLINE SECURED. TIMELINE HEALED.");
      addLog(`DEADLINE STATUS UPDATE: ${task.title} -> ${nextStatus}`);
      if (!isNowComplete) {
        addXp(80);
        if (task.impact === "CRITICAL") {
          updateQuest("quest-1");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate substeps using AI
  const handleGenerateBreakdown = async (task: CyberTask) => {
    setLoadingStepsId(task.id);
    speakRetro(`INITIATING SUBSTEP BREAKDOWN VECTOR FOR: ${task.title}.`);
    addLog(`RUNNING SUBSTEP MATRIX ON: ${task.title}`);

    try {
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          systemPanicState: panicState,
          actionType: "breakdown"
        })
      });
      const data = await res.json();
      if (data && data.steps) {
        await saveTask({
          ...task,
          substeps: data.steps.map((st: any) => ({
            id: st.id,
            title: st.title,
            action: st.action,
            duration: st.duration,
            completed: false
          }))
        });
        setExpandedTaskId(task.id);
        speakRetro("BREAKDOWN MATRIX LOADED SUCCESSFULLY.");
        addLog(`SUBSTEPS LOADED FOR: ${task.title}`);
      }
    } catch (e) {
      console.error("Failed breakdown:", e);
      speakRetro("BREAKDOWN GENERATOR DRIFTED OFF COURSE.");
    } finally {
      setLoadingStepsId(null);
    }
  };

  const handleToggleSubstep = async (task: CyberTask, stepId: number) => {
    if (!task.substeps) return;
    const updated = task.substeps.map(st => st.id === stepId ? { ...st, completed: !st.completed } : st);
    await saveTask({
      ...task,
      substeps: updated
    });
    speakRetro("SUBSTEP STATUS ALTERED.");
  };

  // Add Quick reminder Countdown
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitleInput.trim()) return;
    const mins = parseFloat(remMinsInput) || 5;
    const r: QuickReminder = {
      id: "rem-" + Math.random().toString(36).substring(2, 9),
      title: remTitleInput.toUpperCase(),
      secondsLeft: Math.round(mins * 60),
      initialMinutes: mins
    };

    setReminders(prev => [...prev, r]);
    setRemTitleInput("");
    speakRetro(`TIMER CONFIGURED FOR: ${r.title}. COUNTDOWN ARMED.`);
    addLog(`REMINDER DEPLOYED: ${r.title} (${mins}M)`);
  };

  // Auto-schedule algorithm (Optimizes hours chronological segments)
  const handleAutoSchedule = () => {
    speakRetro("INITIATING TIMELINE COHESION HEURISTICS. OPTIMIZING CHRONOLOGIC BLOCKS.");
    addLog("OPTIMIZING SCHEDULE CHRONOLOGY...");
    
    // Sort tasks based on deadline close first and priority
    const sorted = [...tasks].sort((a, b) => {
      const diffA = new Date(a.deadline).getTime() - new Date().getTime();
      const diffB = new Date(b.deadline).getTime() - new Date().getTime();
      return diffA - diffB;
    });

    setTasks(sorted);
    speakRetro("COHESION TRAJECTORY LOCKED. SYSTEM VECTORS ALIGNED.");
    addLog("TIMELINE AUTO-REORDER COMPLETE.");
  };

  // Demo seeder
  const handleSeedDemoData = async () => {
    speakRetro("SEEDING DEMO TELEMETRY VECTORS.");
    addLog("SEEDING SYSTEM REPLICANTS...");

    const demoTasks = [
      {
        title: "PHYSICS EXAM PREPARATION",
        description: "Review thermodynamic equations and solve sample questionnaires.",
        deadline: new Date(Date.now() + 3600000 * 2).toISOString(), // 2 hours
        impact: "CRITICAL" as const,
        procrastination: "SEVERE" as const,
        status: "PENDING" as const,
        category: "Study",
        createdAt: new Date().toISOString(),
        substeps: [
          { id: 1, title: "Formula Audit", action: "Write Carnot cycle steps on paper", duration: 10, completed: false },
          { id: 2, title: "Questionnaire Run", action: "Do problem 4 in chapter 12", duration: 15, completed: false }
        ]
      },
      {
        title: "REACT ARCHITECTURE DESIGN",
        description: "Draft component hierarchy and setup Firebase storage rules.",
        deadline: new Date(Date.now() + 3600000 * 18).toISOString(), // 18 hours
        impact: "HIGH" as const,
        procrastination: "HIGH" as const,
        status: "PENDING" as const,
        category: "Work",
        createdAt: new Date().toISOString(),
        substeps: []
      },
      {
        title: "TAX FORM FILLING",
        description: "Submit tax declarations before final system cutoff.",
        deadline: new Date(Date.now() + 3600000 * 72).toISOString(), // 3 days
        impact: "MEDIUM" as const,
        procrastination: "AVERAGE" as const,
        status: "PENDING" as const,
        category: "Finance",
        createdAt: new Date().toISOString(),
        substeps: []
      }
    ];

    const demoHabits = [
      { title: "DRINK 3 LITERS H2O", frequency: "DAILY" as const, streak: 3, status: "ACTIVE" as const },
      { title: "45 MIN FOCUS BLOCKS", frequency: "DAILY" as const, streak: 5, status: "ACTIVE" as const }
    ];

    const demoGoals = [
      { title: "PRO DESIGN CERTIFICATE", targetDate: new Date(Date.now() + 86400000 * 30).toISOString(), progress: 45, status: "ACTIVE" as const }
    ];

    try {
      for (const t of demoTasks) {
        await saveTask(t);
      }
      for (const h of demoHabits) {
        await saveHabit(h);
      }
      for (const g of demoGoals) {
        await saveGoal(g);
      }
      speakRetro("TELEMETRY SEED COMPLETED. DASHBOARD SYNCHRONIZED.");
      addLog("SEEDED REPLICANT DATA INTO CLOUD STORE.");
    } catch (e) {
      console.error(e);
    }
  };

  // Speech Recognition simulator / AI chatbot send
  const handleChatSend = async (e: React.FormEvent, customQuery?: string) => {
    e.preventDefault();
    const query = customQuery || chatInput;
    if (!query.trim()) return;

    const userBubble: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "USER",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatFeed(prev => [...prev, userBubble]);
    setChatInput("");
    setIsChatTyping(true);

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
      const botResponse = data?.response || "CONNECTION DRIVEN DRIFTED. TRANSLATION FAILURE.";

      const botBubble: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "COMPANION",
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChatFeed(prev => [...prev, botBubble]);
      speakRetro(botResponse);
      addLog("AI INTERACTION COMPLETED.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleVoiceTrigger = () => {
    if (micListening) {
      setMicListening(false);
      setVoiceIndicatorMsg("Aero mic stand-down complete");
      return;
    }

    setMicListening(true);
    setVoiceIndicatorMsg("Aero listening for speech patterns...");
    speakRetro("VOICE ENCODER ENGAGED. CAPTURING VOCAL COMMONS.");

    setTimeout(() => {
      const sampleQueries = [
        "Help me clear Physics Exam deadline",
        "Engage extreme focus on react design",
        "Seed demo tasks for dynamic testing"
      ];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      setChatInput(randomQuery);
      setMicListening(false);
      setVoiceIndicatorMsg("Vocal vector captured successfully");
      speakRetro(`DETECTED COGNITIVE PHRASE: ${randomQuery}`);
    }, 2500);
  };

  // Calculate dynamic system Panic index
  const calculateSystemPanicIndex = () => {
    if (tasks.length === 0) return 0;
    const activeTasks = tasks.filter(t => t.status !== "COMPLETED");
    if (activeTasks.length === 0) return 0;

    let score = activeTasks.length * 8;
    activeTasks.forEach(t => {
      if (t.impact === "CRITICAL") score += 20;
      if (t.impact === "HIGH") score += 12;
      const hoursLeft = (new Date(t.deadline).getTime() - new Date().getTime()) / 3600000;
      if (hoursLeft <= 3 && hoursLeft > 0) score += 25;
    });

    return Math.min(100, Math.round(score));
  };

  const systemPanicIndex = calculateSystemPanicIndex();
  const getPanicIndexLabel = (idx: number) => {
    if (idx === 0) return "CALM";
    if (idx < 30) return "STABLE";
    if (idx < 65) return "ALERT";
    if (idx < 88) return "CRITICAL";
    return "NUCLEAR";
  };

  // Filters deadlines
  const filteredTasks = tasks.filter(t => {
    // search filter
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeBoardFilter === "ALL") return true;
    if (activeBoardFilter === "CRITICAL") return t.impact === "CRITICAL" && t.status !== "COMPLETED";
    if (activeBoardFilter === "COMPLETED") return t.status === "COMPLETED";
    if (activeBoardFilter === "TODAY") {
      const todayStr = new Date().toISOString().split("T")[0];
      return t.deadline.startsWith(todayStr) && t.status !== "COMPLETED";
    }
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#07080D] text-[#f2f4f7] font-sans antialiased overflow-x-hidden selection:bg-pink-500 selection:text-black">
      
      {/* GLITCH CRT GRID MESH BACKGROUNDS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#07080D] to-[#07080D]"></div>
        {/* Animated Cybernetic gradient Orbs */}
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute top-[40%] left-[50%] w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[100px]"></div>
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,36,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,6px_100%] opacity-80"></div>
      </div>

      {/* 1. SIGN-IN AUTH DRAWER CARD OVERLAY */}
      {!isAuthenticated ? (
        <div className="relative z-50 min-h-screen flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md"></div>
          
          <div className="relative border border-pink-500/50 bg-[#0C101F]/90 p-8 rounded-2xl max-w-md w-full shadow-[0_0_25px_rgba(236,72,153,0.25)] text-center">
            {/* Tearing static corner details */}
            <div className="absolute top-2 left-3 text-[8px] font-mono text-cyan-400">// SYS_ACCESS_V3_0</div>
            
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/40 rounded-full flex items-center justify-center text-pink-500 animate-pulse text-2xl font-extrabold shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                <Lock size={26} />
              </div>
              <h2 className="text-3xl font-extrabold tracking-widest text-white uppercase bg-clip-text">AERO</h2>
              <p className="text-xs text-cyan-400 font-semibold tracking-wider uppercase">// COGNITIVE OVERRIDE & SECURE FIREWALL</p>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white/5 border border-slate-800 hover:bg-white/10 hover:border-slate-600 rounded-xl py-3 text-xs font-bold transition-all mb-4 text-white"
            >
              <Sparkle className="text-cyan-400 w-4 h-4" />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-3 items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex-grow border-t border-slate-900"></div>
              <span className="flex-shrink mx-3">Or authorized bypass credentials</span>
              <div className="flex-grow border-t border-slate-900"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 mt-3 text-left">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">COGNITIVE USER EMAIL</label>
                <input 
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#141929] border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">DECRYPTION SECURITY CODES</label>
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#141929] border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 text-slate-200 font-mono tracking-widest"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-pink-500 text-white hover:bg-pink-400 font-bold py-3.5 rounded-xl uppercase text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] mt-2"
              >
                Sign In to Cockpit
              </button>
            </form>

            <p className="text-[10px] text-slate-500 uppercase text-center mt-6">
              COGNITIVE COMPLETED RATIO REQUIREMENT FOR OVERRIDE ACCESS
            </p>
          </div>
        </div>
      ) : (
        /* 2. THE MAIN APPLICATION SYSTEM COCKPIT GRID */
        <div className="relative z-10 flex flex-col min-h-screen">
          
          {/* TOP DYNAMIC SYSTEM HEADER PANEL */}
          <header className="border-b border-pink-500/30 bg-black/85 backdrop-blur px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-pink-500 animate-ping"></span>
              <div>
                <h1 className="text-xl font-black text-white tracking-widest flex items-center gap-2">
                  <Activity size={18} className="text-pink-500" />
                  <span>AERO // LIFE SAVER PROTOCOL</span>
                </h1>
                <p className="text-[10px] text-cyan-400 tracking-wider uppercase font-semibold">COGNITIVE TRIAGE CONSOLE LINKED</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-[#111424] border border-slate-900 rounded-xl px-3 py-1.5 text-center">
                <span className="block text-[9px] text-slate-500 font-bold uppercase">SYSTEM STRESS LEVEL</span>
                <span className={`text-xs font-black uppercase ${systemPanicIndex > 50 ? "text-pink-500 animate-pulse" : "text-cyan-400"}`}>
                  {systemPanicIndex}% - {getPanicIndexLabel(systemPanicIndex)}
                </span>
              </div>

              <div className="flex items-center bg-[#111424] border border-slate-900 rounded-xl p-1">
                {(["STANDARD", "CRITICAL", "NUCLEAR"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setPanicState(p);
                      speakRetro(`PANIC FREQUENCY TRANSFERRED TO ${p}`);
                      addLog(`PANIC STATE SET TO: ${p}`);
                    }}
                    className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase transition-all ${
                      panicState === p 
                        ? p === "STANDARD" ? "bg-cyan-500 text-black font-black shadow" : p === "CRITICAL" ? "bg-amber-500 text-black" : "bg-pink-500 text-white animate-pulse"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* DEMO SEED TRIGGER BUTTON */}
              <button
                onClick={handleSeedDemoData}
                className="border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                Seed Replicant Commitments
              </button>
            </div>
          </header>

          {/* THREE-COLUMN GRID Cockpit VIEW */}
          <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ==================== LEFT SIDEBAR ==================== */}
            <aside className={`lg:col-span-3 flex flex-col gap-6 ${sidebarCollapsed ? "hidden lg:flex" : ""}`}>
              
              {/* Profile card and levels */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-500 uppercase">// INTEL_ID</div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full border border-pink-500/40 p-0.5 shadow-[0_0_8px_rgba(236,72,153,0.2)]">
                    <img 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150" 
                      className="w-full h-full rounded-full object-cover" 
                      alt="Pilot" 
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs">Alex Mercer</h3>
                    <p className="text-[10px] text-slate-400 italic">alex.mercer@gmail.com</p>
                    <span className="text-[9px] bg-yellow-500 text-slate-900 px-2 py-0.5 rounded font-black mt-1.5 inline-block">LVL {userLevel}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase mb-1">
                    <span>COGNITIVE XP UNITS</span>
                    <span>{userXp} / 500</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 transition-all duration-500" style={{ width: `${(userXp / 500) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Circular SVG Panic Level Gauge */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-3 block tracking-wider">// SYSTEM PANIC ROTATION</span>
                
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="72" cy="72" r="54" stroke="#101424" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="54" 
                      stroke={systemPanicIndex > 70 ? "#EC4899" : systemPanicIndex > 40 ? "#F59E0B" : "#06B6D4"} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="339" 
                      strokeDashoffset={339 - (339 * systemPanicIndex) / 100}
                      className="transition-all duration-700" 
                    />
                  </svg>
                  <div className="text-center z-10">
                    <h4 className="text-3xl font-black text-white">{systemPanicIndex}</h4>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 block">{getPanicIndexLabel(systemPanicIndex)}</span>
                  </div>
                </div>
              </div>

              {/* Daily Quests List */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl">
                <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5 mb-3.5">
                  <Trophy size={14} className="text-yellow-500 animate-pulse" />
                  <span className="font-bold text-[10px] text-slate-300 uppercase tracking-widest">ACTIVE DAILY QUESTS</span>
                </div>
                <div className="space-y-2.5">
                  {quests.map(q => (
                    <div key={q.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
                      q.completed 
                        ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-400 opacity-60" 
                        : "bg-black/40 border-slate-900 text-slate-300 hover:border-slate-800"
                    }`}>
                      <div className="flex items-center gap-2">
                        <CyberCheckbox checked={q.completed} variant="emerald" />
                        <span className={q.completed ? "line-through" : ""}>{q.title}</span>
                      </div>
                      <span className="text-[9px] font-bold text-yellow-500">+{q.xp} XP</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5 flex-wrap mt-4 border-t border-slate-900 pt-3">
                  {badges.map(b => (
                    <div 
                      key={b.id} 
                      title={`${b.label}: ${b.desc}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] ${
                        b.unlocked 
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.2)]" 
                          : "bg-black border-slate-900 text-slate-600 cursor-not-allowed"
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Habits tracker panel */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-pink-500" />
                    <span className="font-bold text-[10px] text-slate-300 uppercase tracking-widest">HABITS RE-ENFORCER</span>
                  </div>
                </div>

                <form onSubmit={handleAddHabit} className="flex gap-1.5 mb-3">
                  <input 
                    type="text" 
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    placeholder="HYDRATE, REVISE, CODE..."
                    className="flex-grow bg-black/60 border border-slate-900 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-cyan-500"
                  />
                  <button type="submit" className="bg-cyan-500 text-black px-3.5 rounded-xl font-bold text-xs hover:bg-cyan-400">
                    +
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {habits.map(h => {
                    const isDoneToday = h.lastCompleted === new Date().toISOString().split("T")[0];
                    return (
                      <div key={h.id} className="p-2.5 rounded-xl border border-slate-900 bg-black/40 flex items-center justify-between">
                        <div>
                          <h4 className={`text-[11px] font-bold ${isDoneToday ? "line-through text-slate-500" : "text-slate-200"}`}>{h.title}</h4>
                          <span className="text-[8px] text-pink-400 font-mono flex items-center gap-1 mt-0.5">
                            <Flame size={10} /> {h.streak} DAYS ACTIVE
                          </span>
                        </div>
                        <button
                          onClick={() => handleCompleteHabit(h)}
                          disabled={isDoneToday}
                          className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                            isDoneToday 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-400 hover:text-black"
                          }`}
                        >
                          {isDoneToday ? "VERIFIED" : "SUCCEED"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick countdown timers reminders */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl">
                <span className="block font-bold text-[10px] text-slate-300 uppercase tracking-widest mb-3.5 border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
                  QUICK DISPATCH TIMER countdown
                </span>

                <form onSubmit={handleAddReminder} className="space-y-2 mb-3">
                  <input 
                    type="text" 
                    value={remTitleInput}
                    onChange={(e) => setRemTitleInput(e.target.value)}
                    placeholder="TIMER LABEL..."
                    className="w-full bg-black/60 border border-slate-900 rounded-xl p-2 text-[10px] focus:outline-none focus:border-cyan-500 uppercase"
                    required
                  />
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      value={remMinsInput}
                      onChange={(e) => setRemMinsInput(e.target.value)}
                      placeholder="MINS" 
                      className="w-20 bg-black/60 border border-slate-900 rounded-xl p-2 text-[10px] text-center"
                      required
                    />
                    <button type="submit" className="flex-1 bg-pink-500 text-white font-extrabold text-[10px] py-1.5 rounded-xl uppercase hover:bg-pink-400">
                      ARM COUNTDOWN
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {reminders.map(rem => {
                    const m = Math.floor(rem.secondsLeft / 60);
                    const s = rem.secondsLeft % 60;
                    return (
                      <div key={rem.id} className="p-2.5 rounded-xl bg-black/30 border border-slate-900 flex items-center justify-between text-[11px] font-mono">
                        <div>
                          <p className="font-extrabold text-white text-[10px]">{rem.title}</p>
                          <span className={`text-[9px] font-bold uppercase mt-0.5 block ${rem.secondsLeft < 60 ? "text-pink-500 animate-pulse" : "text-cyan-400"}`}>
                            {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
                          </span>
                        </div>
                        <button 
                          onClick={() => setReminders(prev => prev.filter(r => r.id !== rem.id))}
                          className="text-slate-500 hover:text-red-400 transition-all p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </aside>

            {/* ==================== CENTER MAIN DASHBOARD ==================== */}
            <main className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Telemetry quick header search & mic controls */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3.5 top-3 text-slate-500" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search by name, category, or stakes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* MIC VOICE COMMAND TRIGGER */}
                  <button 
                    onClick={handleVoiceTrigger}
                    className={`p-2 rounded-xl border transition-all ${
                      micListening 
                        ? "border-pink-500 bg-pink-500/10 text-pink-400 animate-pulse" 
                        : "border-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-slate-950"
                    }`}
                    title="Speak with AI Mainframe"
                  >
                    <Mic size={15} />
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{voiceIndicatorMsg}</span>
                </div>
              </div>

              {/* Stats telemetry dashboard cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-slate-900 bg-[#0E1222]/80 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-black text-white block">{tasks.length}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Total Deadlines</span>
                </div>
                <div className="border border-slate-900 bg-[#0E1222]/80 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-black text-emerald-400 block">{tasks.filter(t => t.status === "COMPLETED").length}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Completed</span>
                </div>
                <div className="border border-slate-900 bg-[#0E1222]/80 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-black text-pink-500 block">{tasks.filter(t => t.impact === "CRITICAL" && t.status !== "COMPLETED").length}</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Critical delays</span>
                </div>
                <div className="border border-slate-900 bg-[#0E1222]/80 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-black text-cyan-400 block">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "COMPLETED").length / tasks.length) * 100) : 0}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">Productivity</span>
                </div>
              </div>

              {/* Collapsible expandable Create commitment drawer */}
              <div className="border border-slate-900 bg-[#0E1222]/80 rounded-2xl p-4">
                <button 
                  onClick={() => setIsTaskFormOpen(!isTaskFormOpen)}
                  className="w-full flex items-center justify-between font-black text-[10px] text-cyan-400 uppercase tracking-widest py-1"
                >
                  <span className="flex items-center gap-2">
                    <Plus size={14} />
                    Create New Task
                  </span>
                  {isTaskFormOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isTaskFormOpen && (
                  <form onSubmit={handleCreateTask} className="mt-4 space-y-4 border-t border-slate-900/60 pt-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">TASK NAME / TARGET</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. SOLVE COMPILER BUGS..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full bg-black/60 border border-slate-900 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 uppercase font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">DEADLINE LIMIT</label>
                        <input 
                          type="datetime-local" 
                          required
                          value={newTaskDeadline}
                          onChange={(e) => setNewTaskDeadline(e.target.value)}
                          className="w-full bg-black/60 border border-slate-900 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">STAKES IMPORTANCE</label>
                        <select 
                          value={newTaskImportance}
                          onChange={(e) => setNewTaskImportance(e.target.value as any)}
                          className="w-full bg-[#111424] border border-slate-900 rounded-xl p-3 focus:outline-none"
                        >
                          <option value="CRITICAL">Critical stakes</option>
                          <option value="HIGH">High importance</option>
                          <option value="MEDIUM">Medium scale</option>
                          <option value="LOW">Low risk</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">EST. WORK TIME (HOURS)</label>
                        <input 
                          type="number" 
                          step="0.5" 
                          value={newTaskDuration}
                          onChange={(e) => setNewTaskDuration(e.target.value)}
                          className="w-full bg-black/60 border border-slate-900 rounded-xl p-3 text-xs text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">CATEGORY INDEX</label>
                        <select 
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          className="w-full bg-[#111424] border border-slate-900 rounded-xl p-3 focus:outline-none"
                        >
                          <option value="Study">Study</option>
                          <option value="Work">Work</option>
                          <option value="Finance">Finance</option>
                          <option value="Life">Life</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">COMMITMENT SYNOPSIS</label>
                      <textarea 
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Detail the failure impact factors..."
                        className="w-full bg-black/60 border border-slate-900 rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 h-20"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setIsTaskFormOpen(false)}
                        className="border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl"
                      >
                        Abort
                      </button>
                      <button 
                        type="submit"
                        className="bg-pink-500 text-white font-extrabold px-5 py-2 rounded-xl hover:bg-pink-400 uppercase tracking-widest"
                      >
                        Secure Target
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* SVG Performance insights layout */}
              <section className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-900 pb-3 mb-4">
                  <h3 className="font-extrabold text-[11px] text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-cyan-400" />
                    COGNITIVE PERFORMANCE INSIGHTS
                  </h3>
                  
                  <div className="flex bg-black/60 p-1 rounded-lg border border-slate-900 text-[9px] font-bold uppercase">
                    {(["COMPLETIONS", "PANIC", "HOURS"] as const).map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveChartTab(tab)}
                        className={`px-2 py-1 rounded transition-all ${activeChartTab === tab ? "bg-cyan-500 text-black font-black" : "text-slate-400 hover:text-white"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-44 bg-black/40 border border-slate-900 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden">
                  
                  {activeChartTab === "COMPLETIONS" && (
                    <svg className="w-full h-full" viewBox="0 0 400 150">
                      {/* Grid lines */}
                      <line x1="0" y1="30" x2="400" y2="30" stroke="#121626" strokeDasharray="4" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="#121626" strokeDasharray="4" />
                      <line x1="0" y1="120" x2="400" y2="120" stroke="#121626" strokeDasharray="4" />
                      
                      {/* completions plotting curve */}
                      <path 
                        d="M 20,130 Q 100,110 180,60 T 380,10" 
                        fill="none" 
                        stroke="#06B6D4" 
                        strokeWidth="3.5" 
                        className="animate-pulse" 
                      />
                      <circle cx="20" cy="130" r="5" fill="#EC4899" />
                      <circle cx="180" cy="60" r="5" fill="#06B6D4" />
                      <circle cx="380" cy="10" r="5" fill="#06B6D4" />
                      
                      {/* labels */}
                      <text x="15" y="145" fill="#64748b" className="text-[8px] font-mono">DAY 1</text>
                      <text x="175" y="145" fill="#64748b" className="text-[8px] font-mono">DAY 3</text>
                      <text x="350" y="145" fill="#06B6D4" className="text-[8px] font-mono font-bold">VECTORS OK</text>
                    </svg>
                  )}

                  {activeChartTab === "PANIC" && (
                    <svg className="w-full h-full" viewBox="0 0 400 150">
                      <path 
                        d="M 10,140 C 90,130 150,10 220,90 T 390,110" 
                        fill="none" 
                        stroke="#EC4899" 
                        strokeWidth="3" 
                      />
                      <circle cx="220" cy="90" r="6" fill="#EC4899" />
                      <text x="235" y="90" fill="#EC4899" className="text-[8px] font-mono font-bold">CRITICAL DECAY SHIFT</text>
                    </svg>
                  )}

                  {activeChartTab === "HOURS" && (
                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                      {/* Donut slice categories */}
                      <circle cx="50" cy="50" r="35" stroke="#06B6D4" strokeWidth="12" fill="transparent" strokeDasharray="220" strokeDashoffset="45" />
                      <circle cx="50" cy="50" r="35" stroke="#EC4899" strokeWidth="12" fill="transparent" strokeDasharray="220" strokeDashoffset="180" />
                      <circle cx="50" cy="50" r="35" stroke="#eab308" strokeWidth="12" fill="transparent" strokeDasharray="220" strokeDashoffset="210" />
                      
                      <text x="50" y="55" fill="#fff" textAnchor="middle" className="text-[10px] font-bold font-mono">DENSITY</text>
                    </svg>
                  )}

                </div>

                <div className="mt-4 bg-[#080B15] p-3 border border-slate-900 rounded-xl">
                  <h4 className="text-[9px] font-bold text-pink-400 uppercase mb-1.5 flex items-center gap-1">
                    <Bot size={11} /> AERO AI DIAGNOSTIC INSIGHTS
                  </h4>
                  {isDiagnosing ? (
                    <p className="text-[10px] text-slate-500 animate-pulse">Formulating cognitive triage telemetry...</p>
                  ) : aiDiagnostic ? (
                    <ul className="space-y-1 text-[10px] text-slate-400 font-mono">
                      <li className="text-slate-200">"{aiDiagnostic.criticalAdvice}"</li>
                      {aiDiagnostic.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <ChevronRight size={10} className="text-cyan-400 mt-0.5" />
                          <span>{rec.title}: {rec.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">No failures detected. Continue target work.</p>
                  )}
                </div>
              </section>

              {/* Deadlines lists board with tab filters */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="font-extrabold text-[11px] text-slate-300 uppercase tracking-widest">ACTIVE TIMELINE OFFENSIVE</h3>
                  
                  <div className="flex bg-black/60 p-1 rounded-lg border border-slate-900 text-[9px] font-bold uppercase">
                    {(["ALL", "CRITICAL", "TODAY", "COMPLETED"] as const).map(f => (
                      <button 
                        key={f}
                        onClick={() => setActiveBoardFilter(f)}
                        className={`px-2.5 py-1 rounded transition-all ${activeBoardFilter === f ? "bg-pink-500 text-white" : "text-slate-400 hover:text-white"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 italic text-[11px]">
                      [ NO COMPATIBLE DEADLINES DETECTED ]
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const isOverdue = new Date(task.deadline).getTime() < new Date().getTime();
                      const isComplete = task.status === "COMPLETED";

                      return (
                        <div 
                          key={task.id} 
                          className={`p-4 rounded-xl border relative transition-all ${
                            isComplete 
                              ? "bg-emerald-950/5 border-emerald-500/20 text-emerald-400/80" 
                              : task.impact === "CRITICAL"
                                ? "bg-pink-950/5 border-pink-500/40 shadow-[0_0_12px_rgba(236,72,153,0.1)]"
                                : "bg-black/40 border-slate-900 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5">
                                <CyberCheckbox 
                                  checked={isComplete} 
                                  onChange={() => handleToggleTaskComplete(task)} 
                                  variant="emerald" 
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isComplete ? "line-through text-slate-500" : "text-white"}`}>{task.title}</h4>
                                  <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 rounded uppercase">{task.category}</span>
                                  {task.impact === "CRITICAL" && !isComplete && (
                                    <span className="text-[8px] bg-pink-500 text-white font-extrabold px-1.5 rounded uppercase animate-pulse">CRITICAL STAKES</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                                
                                <div className="flex gap-4 text-[9px] text-slate-500 mt-2 font-mono">
                                  <span>LIMIT: {new Date(task.deadline).toLocaleString()}</span>
                                  {isOverdue && !isComplete && <span className="text-pink-500 font-extrabold">OVERDUE</span>}
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => {
                                speakRetro(`PURGING VECTORED TARGET: ${task.title}`);
                                deleteTask(task.id);
                                addLog(`COMMITMENT PURGED: ${task.title}`);
                              }}
                              className="text-slate-500 hover:text-red-400 p-1"
                              title="Delete Task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Substeps Action breakdown Checklist */}
                          {task.substeps && task.substeps.length > 0 && (
                            <div className="mt-3.5 bg-black/50 border border-slate-900 rounded-xl p-3 space-y-2">
                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">// COGNITIVE MICRO-ACTIONS</div>
                              {task.substeps.map(st => (
                                <div key={st.id} className="flex items-center justify-between text-[10px] font-mono">
                                  <div className="flex items-center gap-2">
                                    <CyberCheckbox 
                                      checked={st.completed}
                                      onChange={() => handleToggleSubstep(task, st.id)}
                                      variant="cyan"
                                    />
                                    <span className={st.completed ? "line-through text-slate-600" : "text-slate-300"}>{st.title} - {st.action}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500">{st.duration} MINS</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick protocol triggers */}
                          <div className="mt-4 pt-3.5 border-t border-slate-900/60 flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => handleGenerateBreakdown(task)}
                              disabled={loadingStepsId === task.id}
                              className="border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500 hover:text-black font-extrabold text-[9px] px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all"
                            >
                              {loadingStepsId === task.id ? "Analyzing..." : "Plan Micro-Actions"}
                            </button>
                            
                            {!isComplete && (
                              <>
                                <button
                                  onClick={() => {
                                    setStudyCoachTask(task);
                                    speakRetro(`LAUNCHING AERO STUDY COACH STRATEGY PLAN FOR ${task.title}`);
                                  }}
                                  className="border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500 hover:text-white font-extrabold text-[9px] px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all"
                                >
                                  Study Coach
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveFocusTask(task);
                                    updateQuest("quest-3");
                                  }}
                                  className="border border-pink-500/50 bg-pink-500/10 hover:bg-pink-500 hover:text-black font-extrabold text-[9px] px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition-all shadow-[0_0_8px_rgba(236,72,153,0.15)]"
                                >
                                  Focus Protocol
                                </button>
                              </>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </main>

            {/* ==================== RIGHT SIDEBAR ==================== */}
            <aside className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Daily calendar timeline slots */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl flex flex-col h-96">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3.5">
                  <span className="font-bold text-[10px] text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={13} className="text-cyan-400" />
                    AI DAILY SCHEDULE
                  </span>
                  
                  <button 
                    onClick={handleAutoSchedule}
                    className="bg-cyan-500 text-black font-black text-[8px] px-2.5 py-1 rounded uppercase tracking-wider hover:bg-cyan-400"
                  >
                    Auto-Schedule
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {[
                    { time: "09:00", label: "RESTORE RETRO ENGINE STATUS", active: false },
                    { time: "11:00", label: "STUDY SESSION BLOCK ALPHA", active: true },
                    { time: "14:00", label: "RESTORE TIMELINE METRICS", active: false },
                    { time: "16:00", label: "TACTICAL COGNITIVE BREAKDOWNS", active: true },
                    { time: "19:00", label: "FAILSAFE STUDY COACH COHORT", active: false }
                  ].map((slot, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border flex gap-3 text-[10px] font-mono ${
                      slot.active 
                        ? "bg-cyan-500/5 border-cyan-500/30 text-cyan-400" 
                        : "bg-black/30 border-slate-900 text-slate-500"
                    }`}>
                      <span className="font-bold">{slot.time}</span>
                      <span className={slot.active ? "text-slate-200" : ""}>{slot.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat feedback assistant console */}
              <div className="border border-slate-900 bg-[#0E1222]/80 p-5 rounded-2xl flex flex-col flex-grow min-h-[350px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <Bot className="text-cyan-400" size={14} />
                    <span className="font-bold text-[10px] text-slate-300 uppercase tracking-widest">AERO COGNITIVE MAINFRAME</span>
                  </div>
                  <button 
                    onClick={() => setChatFeed([])}
                    className="text-[9px] font-bold text-slate-500 hover:text-white uppercase font-mono"
                  >
                    Clear
                  </button>
                </div>

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto max-h-[220px] bg-black/40 border border-slate-900 rounded-xl p-3 mb-3.5 space-y-3">
                  {chatFeed.map(bubble => (
                    <div key={bubble.id} className={`flex flex-col ${bubble.sender === "USER" ? "items-end" : "items-start"}`}>
                      <span className="text-[8px] text-slate-500 font-mono mb-0.5">{bubble.sender === "USER" ? "alex" : "aero"}</span>
                      <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed border ${
                        bubble.sender === "USER" 
                          ? "bg-pink-500/10 border-pink-500/20 text-pink-300 rounded-tr-none" 
                          : "bg-cyan-500/5 border-cyan-500/20 text-cyan-300 rounded-tl-none"
                      }`}>
                        {bubble.text}
                      </div>
                    </div>
                  ))}

                  {isChatTyping && (
                    <div className="text-[10px] font-bold text-cyan-400 animate-pulse flex items-center gap-1.5 font-mono">
                      <Bot size={11} className="animate-spin" />
                      <span>TRANSLATING CYBER TELEMETRY...</span>
                    </div>
                  )}
                </div>

                {/* Chat presets quick launch */}
                <div className="flex flex-wrap gap-1 text-[8px] font-bold uppercase mb-3.5">
                  {[
                    "I am stuck on physics preparation!",
                    "Reschedule overlapping commitments",
                    "Overcome acute study procrastination"
                  ].map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChatSend(new Event("submit") as any, phrase)}
                      className="bg-black border border-slate-900 rounded px-2 py-1 text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-all text-left truncate max-w-full"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                {/* Input forms */}
                <form onSubmit={handleChatSend} className="flex gap-1.5">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask Aero AI companion..."
                    className="flex-grow bg-black/60 border border-slate-900 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-cyan-500 text-slate-200 font-mono"
                  />
                  <button type="submit" className="bg-cyan-500 text-black px-3 rounded-xl font-bold text-xs hover:bg-cyan-400">
                    <Send size={12} />
                  </button>
                </form>
              </div>

            </aside>

          </div>

          {/* DYNAMIC TELEMETRY FOOTER */}
          <footer className="border-t border-slate-900 bg-black/90 p-5 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs font-mono">
              <div className="flex-1 bg-[#090b15] border border-slate-900 rounded-xl p-3 max-h-24 overflow-y-auto">
                <span className="text-[8px] text-pink-500 font-black block uppercase tracking-widest mb-1">SYSTEM COGNITIVE LOGS STREAM</span>
                <div className="space-y-0.5">
                  {systemLogs.map((log, idx) => (
                    <p key={idx} className="text-[9px] text-slate-500 select-all">{log}</p>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider text-center md:text-right select-none font-bold">
                AERO COGNITIVE WORKSPACE V3.0 • POWERED BY DURABLE CLOUD ARCHITECTURE & GEMINI 2.5 ENGINE
              </p>
            </div>
          </footer>

          {/* DYNAMIC FOCUS MODE POMODORO OVERLAY SCREEN */}
          {activeFocusTask && (
            <FocusModeView 
              task={activeFocusTask}
              onClose={() => {
                setActiveFocusTask(null);
                fetchAiSuggestions();
              }}
              panicState={panicState}
            />
          )}

          {/* DYNAMIC STUDY COACH OVERLAY DRAWER PANEL */}
          {studyCoachTask && (
            <div className="fixed inset-0 bg-black/80 z-50 flex justify-end">
              <div className="absolute inset-0" onClick={() => setStudyCoachTask(null)}></div>
              
              <div className="relative w-full max-w-md h-full bg-[#0E1222] border-l border-pink-500/30 p-6 flex flex-col shadow-[0_0_25px_rgba(236,72,153,0.15)] font-mono text-xs overflow-y-auto">
                <button 
                  onClick={() => setStudyCoachTask(null)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>

                <div className="mb-6 border-b border-slate-900 pb-4">
                  <span className="text-[9px] bg-cyan-500 text-black font-black px-2 py-0.5 rounded uppercase">STUDY COACH OVERLAYS</span>
                  <h3 className="text-xl font-bold text-white mt-2 uppercase">{studyCoachTask.title}</h3>
                  <p className="text-[10px] text-slate-400 italic mt-0.5">Assisting with customized execution blueprints.</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-pink-500 uppercase mb-2">// MASTER REVISION TOPICS</h4>
                    <ul className="space-y-1.5">
                      <li className="bg-black/40 border border-slate-900 p-2 rounded-lg text-slate-300">1. Fundamental conceptual theory review</li>
                      <li className="bg-black/40 border border-slate-900 p-2 rounded-lg text-slate-300">2. Solve baseline diagnostic questionnaires</li>
                      <li className="bg-black/40 border border-slate-900 p-2 rounded-lg text-slate-300">3. Apply active retrieval mock tests</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[10px] text-pink-500 uppercase mb-2">// POMODORO COGNITIVE TARGETS</h4>
                    <div className="p-3 bg-black/60 border border-dashed border-pink-500/20 rounded-xl space-y-2">
                      <p className="font-bold text-white">Recommended: 2 Focus Sessions (25m) + 5m Break loops</p>
                      <p className="text-[10px] text-slate-400">Maximize theta waves using binaural synth drone during work loops.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[10px] text-pink-500 uppercase mb-2">// COACH STRATEGIC SUMMARY</h4>
                    <p className="p-3 bg-cyan-500/5 border border-cyan-500/25 rounded-xl text-cyan-300 leading-relaxed italic">
                      "Break down formulas to primitive units. Write proofs by hand to bypass memory bypass errors. Take short rest intervals when chrono counter expires."
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setActiveFocusTask(studyCoachTask);
                    setStudyCoachTask(null);
                  }}
                  className="w-full mt-auto bg-pink-500 hover:bg-pink-400 text-white font-extrabold py-3.5 rounded-xl uppercase tracking-widest text-xs"
                >
                  Initiate Focus Loop
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC ALARM REMINDER REM OVERLAY POPUP */}
          {triggeredAlarm && (
            <div className="fixed inset-0 z-50 bg-[#07080D]/95 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-red-950/20 animate-pulse"></div>
              
              <div className="relative border border-red-500 bg-black/95 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_35px_rgba(239,68,68,0.5)]">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/40 rounded-full flex items-center justify-center text-red-500 animate-bounce mx-auto mb-4 text-3xl">
                  <AlertTriangle size={32} />
                </div>

                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1.5">ALERT: DISPATCH CUTOFF TRIPPED</h3>
                <p className="text-xs text-red-400 font-mono uppercase tracking-wider mb-4">// {triggeredAlarm.title}</p>
                <p className="text-slate-400 text-[11px] leading-relaxed mb-6">
                  Your designated dispatch countdown has successfully completed. Reinstate your physical focus state or hydration index.
                </p>

                <button 
                  onClick={() => setTriggeredAlarm(null)}
                  className="w-full bg-red-500 text-white hover:bg-red-400 font-bold py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                >
                  Dismiss Alarm Signal
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
