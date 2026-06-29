import React, { useState } from "react";
import { Clock, Calendar, AlertOctagon } from "lucide-react";
import { CyberTask, saveTask } from "../firebase";
import { speakRetro } from "../utils/voice";

interface VisualTimelineProps {
  tasks: CyberTask[];
  onTaskChange: () => void;
}

export default function VisualTimeline({ tasks, onTaskChange }: VisualTimelineProps) {
  const [selectedTask, setSelectedTask] = useState<CyberTask | null>(null);
  const [reschedulingHour, setReschedulingHour] = useState<number>(2);

  const handleReschedule = async () => {
    if (!selectedTask) return;
    
    const originalDate = new Date(selectedTask.deadline);
    const updatedDate = new Date(originalDate.getTime() + reschedulingHour * 60 * 60 * 1000);
    
    await saveTask({
      ...selectedTask,
      deadline: updatedDate.toISOString()
    });
    
    onTaskChange();
    speakRetro(`TIME SHIFT RESOLVED. ${selectedTask.title} RE-ALIGNED BY +${reschedulingHour} HOURS.`);
    setSelectedTask(null);
  };

  const now = new Date();
  
  const imminent = tasks.filter(t => {
    const hours = (new Date(t.deadline).getTime() - now.getTime()) / 3600000;
    return hours > 0 && hours <= 6 && t.status !== "COMPLETED";
  });

  const next24h = tasks.filter(t => {
    const hours = (new Date(t.deadline).getTime() - now.getTime()) / 3600000;
    return hours > 6 && hours <= 24 && t.status !== "COMPLETED";
  });

  const scheduledLater = tasks.filter(t => {
    const hours = (new Date(t.deadline).getTime() - now.getTime()) / 3600000;
    return hours > 24 && t.status !== "COMPLETED";
  });

  return (
    <section className="sleek-panel rounded-3xl p-6 relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-cyan-400" size={18} />
            <span>Time Horizon Forecast</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Chronological warning grids mapping deadline density.</p>
        </div>
      </div>

      {/* Grid Track buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 relative z-10 flex-1">
        
        {/* Track 1: Imminent (< 6 Hours) */}
        <div className="bg-pink-500/5 border border-pink-500/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-pink-500/20 pb-2 mb-3">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Imminent (0-6h)
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
          </div>
          
          <div className="space-y-2.5 overflow-y-auto max-h-[160px] md:max-h-none flex-1">
            {imminent.length === 0 ? (
              <span className="text-xs text-slate-500 italic block py-2">[ No urgent threats ]</span>
            ) : (
              imminent.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTask(t)}
                  className="p-3 rounded-xl bg-[#0A0C10] border border-pink-500/20 cursor-pointer hover:bg-pink-500/10 transition-all"
                >
                  <div className="text-xs font-semibold text-white truncate">{t.title}</div>
                  <div className="text-[10px] text-pink-400 flex items-center justify-between mt-1.5 font-medium">
                    <span>Critical Alert</span>
                    <AlertOctagon size={11} className="animate-pulse" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Track 2: Day Warning (6h - 24h) */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Next 24 Hours
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[160px] md:max-h-none flex-1">
            {next24h.length === 0 ? (
              <span className="text-xs text-slate-500 italic block py-2">[ Clear window ]</span>
            ) : (
              next24h.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTask(t)}
                  className="p-3 rounded-xl bg-[#0A0C10] border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-all"
                >
                  <div className="text-xs font-semibold text-white truncate">{t.title}</div>
                  <div className="text-[10px] text-amber-400 flex items-center justify-between mt-1.5 font-medium">
                    <span>Expiring Today</span>
                    <Clock size={11} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Track 3: Horizon Horizon (> 24h) */}
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Future Horizon
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[160px] md:max-h-none flex-1">
            {scheduledLater.length === 0 ? (
              <span className="text-xs text-slate-500 italic block py-2">[ No future items ]</span>
            ) : (
              scheduledLater.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTask(t)}
                  className="p-3 rounded-xl bg-[#0A0C10] border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-all"
                >
                  <div className="text-xs font-semibold text-white truncate">{t.title}</div>
                  <div className="text-[10px] text-cyan-400 flex items-center justify-between mt-1.5 font-medium">
                    <span>Stable Orbit</span>
                    <Clock size={11} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Time-shifter overlay console */}
      {selectedTask && (
        <div className="border border-slate-800 rounded-2xl bg-[#0A0C10]/95 p-4 text-xs mt-2 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-cyan-400 font-semibold uppercase">
              Time Shift Matrix: {selectedTask.title}
            </span>
            <button 
              onClick={() => setSelectedTask(null)}
              className="text-pink-500 font-bold hover:text-pink-400"
            >
              [ Abort ]
            </button>
          </div>

          <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
            Note: Moving deadlines can help reduce stress spikes but may trigger a high workload later. Plan with caution.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Delay Duration:</span>
              <select
                value={reschedulingHour}
                onChange={(e) => setReschedulingHour(Number(e.target.value))}
                className="bg-[#161B22] border border-slate-800 text-slate-200 p-2 rounded-xl focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>+1 Hour</option>
                <option value={2}>+2 Hours</option>
                <option value={4}>+4 Hours</option>
                <option value={12}>+12 Hours</option>
                <option value={24}>+24 Hours (1 Day)</option>
              </select>
            </div>

            <button
              id="confirm-reschedule"
              onClick={handleReschedule}
              className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/15"
            >
              Execute Time Shift
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
