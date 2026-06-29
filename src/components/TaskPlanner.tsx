import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Zap, 
  Clock, 
  Flame, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  AlertOctagon, 
  ChevronDown, 
  ChevronUp,
  Lock
} from "lucide-react";
import { CyberTask, CyberSubstep, saveTask, deleteTask } from "../firebase";
import { speakRetro } from "../utils/voice";

interface TaskPlannerProps {
  tasks: CyberTask[];
  onTaskChange: () => void;
  panicState: "STANDARD" | "CRITICAL" | "NUCLEAR";
  onStartFocusMode?: (task: CyberTask) => void;
}

export default function TaskPlanner({ tasks, onTaskChange, panicState, onStartFocusMode }: TaskPlannerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [impact, setImpact] = useState<CyberTask["impact"]>("MEDIUM");
  const [procrastination, setProcrastination] = useState<CyberTask["procrastination"]>("AVERAGE");
  const [category, setCategory] = useState("ACADEMIC");
  const [isLoadingStepsId, setIsLoadingStepsId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  function calculatePanic(task: CyberTask) {
    const hoursLeft = (new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const impactWeights = { CRITICAL: 5, HIGH: 4, MEDIUM: 2.5, LOW: 1 };
    const procWeights = { SEVERE: 5, HIGH: 4, AVERAGE: 2.5, LOW: 1 };
    
    const impactVal = impactWeights[task.impact] || 2;
    const procVal = procWeights[task.procrastination] || 2;
    
    if (hoursLeft <= 0) return 100;
    
    const timeUrgency = Math.max(0.5, Math.min(12, 48 / Math.max(0.2, hoursLeft)));
    const raw = (timeUrgency * 6) + (impactVal * 4) + (procVal * 2.5);
    const multiplier = panicState === "NUCLEAR" ? 1.3 : panicState === "CRITICAL" ? 1.15 : 1.0;
    
    return Math.min(100, Math.round(raw * multiplier));
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    try {
      const newTask: Omit<CyberTask, "id"> = {
        title: title.toUpperCase(),
        description: description,
        deadline: deadline,
        impact,
        procrastination,
        status: "PENDING",
        category: category.toUpperCase(),
        createdAt: new Date().toISOString(),
        substeps: []
      };

      await saveTask(newTask);
      setTitle("");
      setDescription("");
      setDeadline("");
      setIsFormOpen(false);
      onTaskChange();
      speakRetro(`VECTORED COMMITMENT ACQUIRED: ${newTask.title}`);
    } catch (err) {
      console.error(err);
      speakRetro("TRANSMISSION FAILURE: DATA CORRUPT.");
    }
  };

  const handleGenerateSteps = async (task: CyberTask) => {
    setIsLoadingStepsId(task.id);
    speakRetro(`INITIATING COGNITIVE BREAKDOWN PROTOCOL FOR ${task.title}.`);
    
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
        const generatedSubsteps: CyberSubstep[] = data.steps.map((s: any) => ({
          id: s.id,
          title: s.title.toUpperCase(),
          action: s.action,
          duration: s.duration,
          completed: false
        }));

        await saveTask({
          ...task,
          substeps: generatedSubsteps
        });
        
        onTaskChange();
        speakRetro(data.motivation || "COGNITIVE MATRIX RESOLVED. IMMEDIATE EXECUTION ORDERED.");
      }
    } catch (err) {
      console.error(err);
      speakRetro("BREAKDOWN RESOLUTION HALTED. ANOMALOUS SIGNAL.");
    } finally {
      setIsLoadingStepsId(null);
    }
  };

  const handleToggleSubstep = async (task: CyberTask, substepId: number) => {
    if (!task.substeps) return;
    const updatedSubsteps = task.substeps.map(sub => 
      sub.id === substepId ? { ...sub, completed: !sub.completed } : sub
    );

    const allCompleted = updatedSubsteps.every(s => s.completed);

    await saveTask({
      ...task,
      substeps: updatedSubsteps,
      status: allCompleted ? "COMPLETED" : "ACTIVE"
    });
    
    onTaskChange();
    speakRetro(allCompleted ? `ALL MICRO ACTIONS RESOLVED FOR ${task.title}.` : "SUBSTEP COMPLETED.");
  };

  const handleToggleTaskStatus = async (task: CyberTask) => {
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    await saveTask({
      ...task,
      status: nextStatus
    });
    onTaskChange();
    speakRetro(`TASK ${task.title} STATUS SHIFTED TO ${nextStatus}.`);
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    onTaskChange();
    speakRetro("COMMITMENT DELETED.");
  };

  const formatDeadline = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) return "EXPIRED";
    if (diffHours < 1) return `${Math.round(diffMs / (1000 * 60))} mins left`;
    if (diffHours < 24) return `${Math.round(diffHours)} hours left`;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getImpactBadge = (imp: CyberTask["impact"]) => {
    switch (imp) {
      case "CRITICAL": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "HIGH": return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "MEDIUM": return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => calculatePanic(b) - calculatePanic(a));

  return (
    <section className="sleek-panel rounded-3xl p-6 flex flex-col h-full relative overflow-hidden">
      
      {/* Absolute graphic glow accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="text-cyan-400" size={18} />
            <span>Smart Priority Triage</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Critical commitments sorted by dynamic risk factors.</p>
        </div>
        
        <button
          id="btn-add-task-drawer"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/15"
        >
          <Plus size={15} />
          {isFormOpen ? "Close Control" : "Log Urgent Task"}
        </button>
      </div>

      {/* Modern Card Form drawer */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6 border border-slate-800 rounded-2xl p-4 bg-[#0A0C10]/60 relative z-10"
          >
            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                    Task Title / Commitment
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Q3 Strategic Proposal"
                    className="w-full bg-[#161B22] border border-slate-800 rounded-xl text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                    Failure point deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-800 rounded-xl text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                  Description & Context
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happens if this is missed? List key dependencies..."
                  className="w-full h-20 bg-[#161B22] border border-slate-800 rounded-xl text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                    Failure Stakes
                  </label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(e.target.value as any)}
                    className="w-full bg-[#161B22] border border-slate-800 rounded-xl text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">Critical Failure</option>
                    <option value="HIGH">High Damage</option>
                    <option value="MEDIUM">Standard Risk</option>
                    <option value="LOW">Low Exposure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                    Inertia Factor
                  </label>
                  <select
                    value={procrastination}
                    onChange={(e) => setProcrastination(e.target.value as any)}
                    className="w-full bg-[#161B22] border border-slate-800 rounded-xl text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SEVERE">Severe Stagnation</option>
                    <option value="HIGH">Heavy Delay</option>
                    <option value="AVERAGE">Average Delay</option>
                    <option value="LOW">Minimal Static</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-800 rounded-xl text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ACADEMIC">Academic</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="FINANCIAL">Financial</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="ENTREPRENEURIAL">Entrepreneurial</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-2.5 rounded-xl transition-all"
                  >
                    Commit to System
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task stream items */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 relative z-10">
        {sortedTasks.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500 uppercase text-xs">
            [ No active threats logged in the queue. All stable. ]
          </div>
        ) : (
          sortedTasks.map((task) => {
            const panicScore = calculatePanic(task);
            const isExpanded = expandedTaskId === task.id;
            const isCompleted = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className={`sleek-card rounded-2xl p-4 transition-all relative ${
                  isCompleted 
                    ? "opacity-60 border-emerald-500/20 bg-emerald-950/5" 
                    : panicScore > 75 
                    ? "border-pink-500/40 bg-pink-500/5 shadow-lg shadow-pink-500/5" 
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Upper header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-semibold font-mono">
                        {task.category}
                      </span>
                      <span className={`text-[10px] border px-2 py-0.5 rounded-md font-semibold uppercase ${getImpactBadge(task.impact)}`}>
                        STAKES: {task.impact}
                      </span>
                    </div>

                    <h3 className={`text-base font-bold text-white tracking-tight ${isCompleted ? "line-through text-slate-500" : ""}`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Urgency Factor Gauge */}
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      Panic Index
                    </span>
                    <span className={`text-xl font-bold font-mono ${
                      panicScore > 75 ? "text-pink-500" : panicScore > 40 ? "text-amber-500" : "text-cyan-400"
                    }`}>
                      {panicScore}%
                    </span>
                  </div>
                </div>

                {/* Deadlines Remaining */}
                <div className="flex items-center justify-between text-xs my-2.5 pt-2.5 border-t border-slate-800/60 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-cyan-400" />
                    <span className={panicScore > 75 ? "text-pink-400 font-semibold" : ""}>
                      Decay Deadline: {formatDeadline(task.deadline)}
                    </span>
                  </div>
                </div>

                {/* Dynamic progress bar slider */}
                {!isCompleted && (
                  <div className="w-full bg-[#0A0C10] h-1.5 rounded-full overflow-hidden mb-3.5 border border-slate-900">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        panicScore > 75 ? "bg-pink-500" : panicScore > 40 ? "bg-amber-500" : "bg-cyan-500"
                      }`} 
                      style={{ width: `${panicScore}%` }}
                    />
                  </div>
                )}

                {/* Footer Toolbar */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
                  <div className="flex gap-2">
                    <button
                      id={`complete-${task.id}`}
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isCompleted
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                          : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black"
                      }`}
                    >
                      {isCompleted ? <CheckSquare size={13} /> : <Square size={13} />}
                      <span>{isCompleted ? "Completed" : "Mark Resolved"}</span>
                    </button>

                    {!isCompleted && (
                      <button
                        id={`breakdown-${task.id}`}
                        onClick={() => handleGenerateSteps(task)}
                        disabled={isLoadingStepsId === task.id}
                        className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        {isLoadingStepsId === task.id ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <Zap size={13} />
                        )}
                        <span>{isLoadingStepsId === task.id ? "Analyzing..." : "Plan Micro-Actions"}</span>
                      </button>
                    )}

                    {!isCompleted && onStartFocusMode && (
                      <button
                        id={`focus-${task.id}`}
                        onClick={() => onStartFocusMode(task)}
                        className="bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-black px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                      >
                        <Lock size={13} className="text-pink-400" />
                        <span>Focus Protocol</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {task.substeps && task.substeps.length > 0 && (
                      <button
                        id={`expand-substeps-${task.id}`}
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}

                    <button
                      id={`delete-${task.id}`}
                      onClick={() => handleDelete(task.id)}
                      className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Substep items */}
                {isExpanded && task.substeps && task.substeps.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-[#0A0C10] border border-slate-800">
                    <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mb-2.5">
                      Recommended Steps Breakdown
                    </div>
                    <div className="space-y-2">
                      {task.substeps.map((sub) => (
                        <div 
                          key={sub.id} 
                          onClick={() => handleToggleSubstep(task, sub.id)}
                          className={`flex items-start gap-3 p-2 cursor-pointer rounded-lg border transition-all ${
                            sub.completed 
                              ? "border-slate-900 bg-slate-950 opacity-60 line-through text-slate-500" 
                              : "border-slate-800/80 bg-[#161B22]/50 hover:bg-[#161B22] text-slate-300"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {sub.id}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold text-xs text-white">{sub.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{sub.action}</div>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-mono font-bold flex items-center gap-0.5">
                            <Clock size={10} /> {sub.duration}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
