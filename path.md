import React, { useState, useEffect, useRef } from 'react';
import { Sun, Leaf, Compass, ChevronRight, X, Play, Lock } from 'lucide-react';

// --- Constants & Mock Data from Style Guide ---
const COLORS = {
  sacredParchment: "#FDF9F3",
  morningCream: "#F4EFE6",
  deepEarth: "#433422",
  terracottaGrace: "#D4A373",
  sagePeace: "#8E9775",
};

const TASKS = [
  { id: 1, title: "Morning Mist", subtitle: "Clear the fog from your mind", duration: "5 MIN", type: "STILLNESS", icon: <Sun size={24} /> },
  { id: 2, title: "Deep Roots", subtitle: "Connect with the earth beneath you", duration: "10 MIN", type: "GROUNDING", icon: <Leaf size={24} /> },
  { id: 3, title: "The Narrow Path", subtitle: "Focus your intentions for the day", duration: "8 MIN", type: "GUIDANCE", icon: <Compass size={24} /> },
  { id: 4, title: "Sunlight Filter", subtitle: "Find warmth in the simple things", duration: "12 MIN", type: "REFLECTION", icon: <Sun size={24} /> },
  { id: 5, title: "Evening Stillness", subtitle: "A quiet descent into rest", duration: "15 MIN", type: "SABBATH", icon: <Leaf size={24} /> },
];

const App = () => {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const containerRef = useRef(null);

  const toggleTask = (id) => {
    if (completedSteps.includes(id)) {
      // Logic: If we uncheck a task, we should probably uncheck everything after it 
      // to maintain the sequential integrity.
      const taskIndex = TASKS.findIndex(t => t.id === id);
      const remainingCompleted = completedSteps.filter(sid => {
        const sidIndex = TASKS.findIndex(t => t.id === sid);
        return sidIndex < taskIndex;
      });
      setCompletedSteps(remainingCompleted);
    } else {
      setCompletedSteps([...completedSteps, id]);
    }
    setActiveTask(null);
  };

  // Syncing path with task containers:
  const pathD = "M 50 0 Q 35 110 50 220 T 50 440 T 50 660 T 50 880 T 50 1100";

  return (
    <div className="relative w-full h-screen bg-[#FDF9F3] text-[#433422] font-sans overflow-hidden selection:bg-[#D4A373]/30">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;700&display=swap');
          
          .font-serif { font-family: 'Lora', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }

          @keyframes sunUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse {
            0% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.6; transform: scale(1); }
          }

          .animate-sun-up {
            animation: sunUp 0.8s ease-out forwards;
          }

          .animate-pulse-slow {
            animation: pulse 4s infinite ease-in-out;
          }

          .arched-horizon {
            border-top-left-radius: 100% 40px;
            border-top-right-radius: 100% 40px;
          }
        `}
      </style>

      {/* Header Area (Sky) */}
      <div className="absolute top-0 left-0 w-full p-8 pt-12 z-20 bg-[#FDF9F3]">
        <div className="animate-sun-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#8E9775] font-bold block mb-2">
            The Sacred Stillness
          </span>
          <h1 className="text-4xl font-serif text-[#433422] italic leading-tight">
            Begin your walk, <br/>Grace
          </h1>
        </div>
      </div>

      {/* Arched Horizon Transition */}
      <div className="absolute top-[180px] left-0 w-full h-20 bg-[#F4EFE6] arched-horizon z-10 shadow-[0_-10px_20px_rgba(67,52,34,0.02)]" />

      {/* The Meandering Stream Visual Container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 overflow-y-auto overflow-x-hidden pt-[200px] pb-64 snap-y bg-[#F4EFE6]"
      >
        <div className="relative w-full h-[1200px] flex flex-col items-center">
          
          {/* Stream SVG Path */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 100 1100" preserveAspectRatio="none">
            {/* The "Dry" Stream (Uncompleted) */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#D4A373" 
              strokeWidth="8" 
              strokeOpacity="0.08"
              strokeLinecap="round"
            />
            {/* The "Flowing" Stream (Progress) */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#D4A373" 
              strokeWidth="10" 
              strokeDasharray="1200"
              strokeDashoffset={1200 - (1200 * (completedSteps.length / TASKS.length))}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out opacity-40 shadow-sm"
            />
          </svg>

          {/* Task Pebbles */}
          {TASKS.map((task, index) => {
            const isCompleted = completedSteps.includes(task.id);
            // Sequential check: Available if it's the first task OR the previous task is completed
            const isAvailable = index === 0 || completedSteps.includes(TASKS[index - 1].id);
            const isLocked = !isAvailable;
            
            const side = index % 2 === 0 ? 'left' : 'right';
            const delay = 0.2 + (index * 0.1);
            
            return (
              <div 
                key={task.id}
                className="relative w-full h-[220px] flex justify-center items-center snap-center animate-sun-up"
                style={{ animationDelay: `${delay}s` }}
              >
                <div 
                  className={`relative flex flex-col items-center transition-all duration-700 ${side === 'left' ? '-translate-x-14' : 'translate-x-14'} ${isLocked ? 'opacity-30 grayscale-[0.5]' : 'opacity-100'}`}
                >
                  {/* The Stone / Button */}
                  <button
                    disabled={isLocked}
                    onClick={() => setActiveTask(task)}
                    className={`
                      relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 shadow-lg
                      ${isCompleted 
                        ? 'bg-[#D4A373] text-[#FDF9F3] rotate-[360deg] shadow-[#D4A373]/20' 
                        : isLocked
                        ? 'bg-[#F4EFE6] text-[#433422]/20 border border-[#433422]/10 cursor-not-allowed'
                        : 'bg-[#FDF9F3] text-[#433422] border border-[#D4A373]/30 hover:border-[#D4A373] shadow-[#433422]/5'
                      }
                    `}
                  >
                    {isCompleted ? <Sun size={24} /> : isLocked ? <Lock size={18} strokeWidth={1.5} /> : React.cloneElement(task.icon, { size: 24 })}
                    
                    {/* Completion Glow */}
                    {isCompleted && (
                      <div className="absolute inset-0 rounded-full bg-[#D4A373] blur-xl opacity-40 animate-pulse" />
                    )}
                  </button>

                  {/* Task Metadata */}
                  <div className={`
                    absolute top-1/2 -translate-y-1/2 whitespace-nowrap px-8 py-2 transition-all duration-700
                    ${side === 'left' ? 'left-16 text-left' : 'right-16 text-right'}
                    ${isCompleted ? 'opacity-30' : isLocked ? 'opacity-40' : 'opacity-100'}
                  `}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8E9775] mb-1">
                      {task.duration} • {task.type}
                    </p>
                    <h3 className="text-2xl font-serif text-[#433422] leading-none">
                      {isLocked ? "• • •" : task.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Modal (Drawer) */}
      {activeTask && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end p-4 bg-[#433422]/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg mx-auto bg-[#FDF9F3] rounded-[40px] p-8 pb-10 shadow-2xl animate-in slide-in-from-bottom-20 duration-500 ring-1 ring-[#433422]/5">
            <div className="w-12 h-1.5 bg-[#F4EFE6] rounded-full mx-auto mb-10" />
            
            <div className="flex items-start justify-between mb-8">
              <div className="max-w-[80%]">
                <span className="text-[11px] uppercase tracking-[0.5em] text-[#D4A373] font-bold block mb-3">
                  {activeTask.type} • {activeTask.duration}
                </span>
                <h2 className="text-4xl font-serif text-[#433422] italic leading-tight">{activeTask.title}</h2>
              </div>
              <button 
                onClick={() => setActiveTask(null)}
                className="p-3 bg-[#F4EFE6] rounded-full text-[#433422]/60 hover:text-[#433422] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-[#433422]/70 font-sans leading-relaxed mb-12 text-xl font-light">
              {activeTask.subtitle}
            </p>

            <div className="flex space-x-3">
              <button 
                onClick={() => toggleTask(activeTask.id)}
                className={`flex-1 py-5 rounded-[24px] font-bold uppercase tracking-[0.2em] text-[10px] transition-all transform active:scale-95 flex items-center justify-center space-x-3 ${
                  completedSteps.includes(activeTask.id)
                  ? 'bg-[#F4EFE6] text-[#433422]/40'
                  : 'bg-[#433422] text-[#FDF9F3] shadow-xl animate-pulse-slow'
                }`}
              >
                {completedSteps.includes(activeTask.id) ? (
                  <span>Mark as incomplete</span>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" stroke="none" />
                    <span>Begin your walk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-18 px-12 rounded-[32px] bg-[#FDF9F3]/95 backdrop-blur-xl border border-[#D4A373]/20 flex items-center justify-between z-30 shadow-2xl shadow-[#433422]/10">
        <button className="text-[#433422]/40 hover:text-[#D4A373] transition-colors">
          <Leaf size={24} strokeWidth={1.5} />
        </button>
        <div className="w-14 h-14 rounded-full bg-[#D4A373]/10 flex items-center justify-center -translate-y-1 ring-4 ring-[#FDF9F3]">
          <div className="w-4 h-4 rounded-full bg-[#D4A373] shadow-[0_0_20px_#D4A373]" />
        </div>
        <button className="text-[#433422]/40 hover:text-[#D4A373] transition-colors">
          <Compass size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#F4EFE6] via-[#F4EFE6]/80 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default App;