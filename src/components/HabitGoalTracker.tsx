import React, { useState } from "react";
import { CyberHabit, CyberGoal, saveHabit, deleteHabit, saveGoal, deleteGoal } from "../firebase";
import { Plus, Trash2, Flame, Trophy, Activity } from "lucide-react";
import { speakRetro } from "../utils/voice";

interface HabitGoalTrackerProps {
  habits: CyberHabit[];
  goals: CyberGoal[];
  onDataChange: () => void;
}

export default function HabitGoalTracker({ habits, goals, onDataChange }: HabitGoalTrackerProps) {
  const [habitTitle, setHabitTitle] = useState("");
  const [habitFreq, setHabitFreq] = useState<"DAILY" | "WEEKLY">("DAILY");
  
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle) return;

    try {
      const newHabit: Omit<CyberHabit, "id"> = {
        title: habitTitle,
        frequency: habitFreq,
        streak: 0,
        status: "ACTIVE"
      };

      await saveHabit(newHabit);
      setHabitTitle("");
      onDataChange();
      speakRetro(`HABIT LOOP ENGAGED: ${newHabit.title}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteHabit = async (habit: CyberHabit) => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    let nextStreak = habit.streak;
    if (habit.lastCompleted !== todayStr) {
      nextStreak += 1;
    }

    await saveHabit({
      ...habit,
      streak: nextStreak,
      lastCompleted: todayStr,
      status: "ACTIVE"
    });
    
    onDataChange();
    speakRetro(`HABIT RE-ENFORCED. CURRENT STREAK: ${nextStreak}.`);
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
    onDataChange();
    speakRetro("HABIT DE-LINKED FROM SYS_CORE.");
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalDate) return;

    try {
      const newGoal: Omit<CyberGoal, "id"> = {
        title: goalTitle,
        targetDate: goalDate,
        progress: 0,
        status: "ACTIVE"
      };

      await saveGoal(newGoal);
      setGoalTitle("");
      setGoalDate("");
      onDataChange();
      speakRetro(`STRATEGIC TRAJECTORY LOGGED: ${newGoal.title}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoalProgress = async (goal: CyberGoal, progress: number) => {
    const status = progress >= 100 ? "ACHIEVED" : "ACTIVE";
    await saveGoal({
      ...goal,
      progress,
      status
    });
    onDataChange();
    if (progress >= 100) {
      speakRetro(`CRITICAL STRATEGIC VICTORY ACHIEVED: ${goal.title}`);
    } else {
      speakRetro(`GOAL UPDATE: ${progress}% COMPLETE.`);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    onDataChange();
    speakRetro("GOAL DELETED.");
  };

  return (
    <section className="sleek-panel rounded-3xl p-6 relative overflow-hidden">
      
      {/* Visual background subtle glows */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* Habit Trackers Column */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="text-cyan-400" size={16} />
              <span>Recurring Daily Habits</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Strengthen daily rituals to reduce procrastination blocks.</p>
          </div>

          {/* Quick Intake Form */}
          <form onSubmit={handleAddHabit} className="flex gap-2 text-xs">
            <input
              type="text"
              required
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              placeholder="Study deep work, hydration loop..."
              className="flex-1 bg-[#161B22] border border-slate-800 text-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
            />
            <select
              value={habitFreq}
              onChange={(e) => setHabitFreq(e.target.value as any)}
              className="bg-[#161B22] border border-slate-800 text-slate-200 p-2 rounded-xl focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
            <button
              type="submit"
              className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/15"
            >
              Track
            </button>
          </form>

          {/* Active Loops list */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {habits.length === 0 ? (
              <p className="text-xs text-slate-500 italic">[ No habits tracked yet ]</p>
            ) : (
              habits.map((habit) => {
                const todayStr = new Date().toISOString().split("T")[0];
                const isCompletedToday = habit.lastCompleted === todayStr;

                return (
                  <div key={habit.id} className="sleek-card rounded-xl p-3 flex items-center justify-between gap-3 border border-slate-800/80">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">{habit.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Cycle: {habit.frequency} | Streak check: {habit.lastCompleted ? "Done today" : "Pending"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleCompleteHabit(habit)}
                        disabled={isCompletedToday}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase border transition-all ${
                          isCompletedToday 
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" 
                            : "border-cyan-500/30 hover:bg-cyan-500 hover:text-black text-cyan-400"
                        }`}
                      >
                        {isCompletedToday ? "Verified" : "Succeed"}
                      </button>

                      {/* Streak badge */}
                      <div className="flex items-center gap-0.5 text-xs text-pink-500 font-bold bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                        <Flame size={12} className="animate-pulse" />
                        <span>{habit.streak}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Strategic Goals Trackers Column */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Trophy className="text-cyan-400" size={16} />
              <span>Deep Strategic Goals</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Map out larger aspirations and step-by-step progress metrics.</p>
          </div>

          {/* Quick Goal Form */}
          <form onSubmit={handleAddGoal} className="flex gap-2 text-xs">
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Acquire professional certification..."
              className="flex-1 bg-[#161B22] border border-slate-800 text-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
            />
            <input
              type="date"
              required
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="bg-[#161B22] border border-slate-800 text-slate-200 p-2 rounded-xl focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/15"
            >
              Add
            </button>
          </form>

          {/* Goals stream */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {goals.length === 0 ? (
              <p className="text-xs text-slate-500 italic">[ No major targets plotted ]</p>
            ) : (
              goals.map((goal) => {
                const target = new Date(goal.targetDate);

                return (
                  <div key={goal.id} className="sleek-card rounded-xl p-3 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-semibold text-white">{goal.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Failsafe Target: {target.toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Progress slider bar */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={goal.progress}
                        onChange={(e) => handleUpdateGoalProgress(goal, Number(e.target.value))}
                        className="flex-1 accent-cyan-500 cursor-pointer h-1.5 bg-[#0A0C10] rounded-full appearance-none border border-slate-900"
                      />
                      <span className="text-xs font-bold text-cyan-400 min-w-[32px] text-right font-mono">
                        {goal.progress}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
