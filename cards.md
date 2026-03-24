import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, 
  ChevronRight, 
  Play, 
  Pause, 
  X, 
  Compass, 
  Leaf, 
  Sun, 
  ArrowLeft,
  Moon,
  Clock,
  Heart
} from 'lucide-react';

const COLORS = {
  sacredParchment: '#FDF9F3',
  morningCream: '#F4EFE6',
  deepEarth: '#433422',
  terracottaGrace: '#D4A373',
  sagePeace: '#8E9775',
};

// --- Mock Data ---
const COLLECTIONS = [
  {
    id: 'walk-1',
    title: 'The Desert Fathers',
    subtitle: 'ANCIENT WISDOM',
    description: 'Find silence in the footsteps of the early ascetics.',
    color: COLORS.terracottaGrace,
    icon: <Sun size={32} />,
    scripture: "Be still, and know that I am God. — Psalm 46:10",
    meditations: [
      { id: 'm1', title: 'The Breath of Life', duration: '12 min', category: 'STILLNESS' },
      { id: 'm2', title: 'Solitude in the Sand', duration: '15 min', category: 'GUIDANCE' },
      { id: 'm3', title: 'The Inner Cell', duration: '10 min', category: 'PRAYER' },
      { id: 'm4', title: 'Unceasing Prayer', duration: '20 min', category: 'DEVOTION' },
    ]
  },
  {
    id: 'walk-2',
    title: 'Grounded Presence',
    subtitle: 'MINDFUL JOURNEY',
    description: 'Connect your body to the Earth through sacred awareness.',
    color: COLORS.sagePeace,
    icon: <Leaf size={32} />,
    scripture: "Every good and perfect gift is from above. — James 1:17",
    meditations: [
      { id: 'm5', title: 'Earth and Spirit', duration: '8 min', category: 'GROUNDING' },
      { id: 'm6', title: 'Sacred Walking', duration: '20 min', category: 'WALK' },
      { id: 'm7', title: 'Morning Light', duration: '10 min', category: 'AWAKENING' },
    ]
  },
  {
    id: 'walk-3',
    title: 'Midnight Psalms',
    subtitle: 'NIGHT PRAYER',
    description: 'Calm the heart before the hours of sacred rest.',
    color: COLORS.deepEarth,
    icon: <Compass size={32} />,
    scripture: "He leads me beside still waters. — Psalm 23:2",
    meditations: [
      { id: 'm8', title: 'Evening Benediction', duration: '15 min', category: 'REST' },
      { id: 'm9', title: 'The Shepherd’s Song', duration: '12 min', category: 'CALM' },
    ]
  }
];

const App = () => {
  const [selectedWalk, setSelectedWalk] = useState(null);
  const [activeMeditation, setActiveMeditation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEntrance, setShowEntrance] = useState(false);

  useEffect(() => {
    // Sun-Up Entrance effect
    const timer = setTimeout(() => setShowEntrance(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenWalk = (walk) => {
    setSelectedWalk(walk);
  };

  const handleCloseWalk = () => {
    setSelectedWalk(null);
    setActiveMeditation(null);
    setIsPlaying(false);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col transition-all duration-1000 ease-out select-none overflow-hidden"
      style={{ 
        backgroundColor: COLORS.sacredParchment, 
        color: COLORS.deepEarth,
        fontFamily: "'Playfair Display', serif" 
      }}
    >
      {/* Header */}
      <header className="pt-12 pb-6 px-8 flex justify-between items-center z-20">
        <div className={`transition-all duration-1000 ${showEntrance ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <h2 className="text-xs font-bold tracking-[0.4em] uppercase opacity-60 font-sans">
            Grace be with you
          </h2>
          <h1 className="text-3xl mt-1 italic">Welcome, Thomas</h1>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F4EFE6] border border-[#D4A373]/10">
          <Sun size={20} className="text-[#D4A373]" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-12 overflow-y-auto z-10 no-scrollbar">
        {!selectedWalk ? (
          <div className="space-y-8 mt-4 px-8">
            <div className={`transition-all duration-1000 delay-300 ${showEntrance ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              <p className="text-lg opacity-80 leading-relaxed max-w-md italic">
                "Digital Sabbath: Lower the heart rate, find the silence within."
              </p>
            </div>

            <div className="grid gap-6">
              {COLLECTIONS.map((walk, index) => (
                <div 
                  key={walk.id}
                  onClick={() => handleOpenWalk(walk)}
                  className={`group relative p-8 rounded-[40px] bg-[#F4EFE6] cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:border-[#D4A373] border-2 border-transparent flex flex-col gap-4 shadow-sm transition-all duration-1000 ${showEntrance ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div style={{ color: walk.color }}>{walk.icon}</div>
                    <ChevronRight size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60 font-sans">
                      {walk.subtitle}
                    </span>
                    <h3 className="text-2xl mt-1">{walk.title}</h3>
                    <p className="text-sm mt-2 opacity-70 font-sans tracking-wide leading-relaxed">
                      {walk.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Book View / Library View with Snap-Scrolling */
          <div className="fixed inset-0 z-50 flex flex-col bg-[#FDF9F3] animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Arched Horizon Transition */}
            <div 
              className="absolute top-0 left-0 right-0 h-40 overflow-hidden pointer-events-none"
              style={{ backgroundColor: selectedWalk.color + '10' }}
            >
              <div 
                className="absolute bottom-0 left-[-20%] right-[-20%] h-32 bg-[#FDF9F3]"
                style={{ 
                  borderTopLeftRadius: '100% 100%', 
                  borderTopRightRadius: '100% 100%',
                }}
              />
            </div>

            {/* Back Nav */}
            <div className="pt-12 px-8 flex justify-between items-center z-20">
              <button 
                onClick={handleCloseWalk}
                className="p-3 rounded-full bg-[#F4EFE6] hover:bg-[#D4A373]/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="text-center">
                 <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60 font-sans">
                    CURRENT WALK
                  </span>
                  <p className="text-sm font-serif italic">{selectedWalk.title}</p>
              </div>
              <div className="w-10" />
            </div>

            {/* ONE-CARD-AT-A-TIME Snap Scroll Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden mt-8 flex items-center no-scrollbar snap-x snap-mandatory scroll-smooth">
               {/* Left Padding to center the first card */}
               <div className="min-w-[10vw] flex-shrink-0" />

               {/* Cover Card */}
               <div className="min-w-[80vw] md:min-w-[380px] h-[480px] flex flex-col justify-end p-10 rounded-[48px] relative overflow-hidden text-white snap-center mx-4 transition-transform duration-500" style={{ backgroundColor: selectedWalk.color }}>
                 <div className="absolute top-10 left-10 opacity-20 transform scale-[4]">
                   {selectedWalk.icon}
                 </div>
                 <h2 className="text-4xl font-serif z-10 leading-tight">{selectedWalk.title}</h2>
                 <p className="text-xs font-sans font-bold tracking-[0.4em] mt-6 opacity-70 z-10 uppercase">{selectedWalk.subtitle}</p>
                 <div className="mt-8 flex items-center gap-3 z-10 opacity-60">
                    <div className="h-[1px] w-8 bg-white" />
                    <span className="text-xs font-sans tracking-widest">SWIPE TO BEGIN</span>
                 </div>
               </div>

               {/* Meditation Cards */}
               {selectedWalk.meditations.map((med, idx) => (
                 <div 
                  key={med.id}
                  onClick={() => setActiveMeditation(med)}
                  className={`min-w-[80vw] md:min-w-[380px] h-[480px] bg-[#F4EFE6] rounded-[48px] p-10 flex flex-col justify-between transition-all duration-500 snap-center mx-4 group cursor-pointer ${activeMeditation?.id === med.id ? 'shadow-2xl ring-2 ring-[#D4A373]' : 'hover:bg-[#EFE9DD]'}`}
                 >
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-40 font-sans">
                        CHAPTER {idx + 1}
                      </span>
                      <h3 className="text-3xl mt-6 leading-tight">{med.title}</h3>
                      <div className="flex items-center gap-4 mt-4 opacity-50 font-sans text-sm">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{med.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Compass size={14} />
                          <span>{med.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-sans opacity-40 italic">Tap to preview session</p>
                       <button 
                        className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{ 
                          backgroundColor: COLORS.deepEarth,
                          color: 'white',
                          boxShadow: activeMeditation?.id === med.id && isPlaying ? `0 0 30px ${selectedWalk.color}88` : 'none'
                        }}
                      >
                        {activeMeditation?.id === med.id && isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                      </button>
                    </div>
                 </div>
               ))}
               
               {/* Right Padding to center the last card */}
               <div className="min-w-[10vw] flex-shrink-0" />
            </div>

            {/* Scripture Footer */}
            <div className="pb-12 px-12 text-center h-24 flex items-center justify-center">
              <p className="text-sm italic opacity-40 max-w-xs mx-auto animate-in fade-in duration-1000">
                {selectedWalk.scripture}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Active Session Mini Player */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-6 z-[60] transition-all duration-700 transform ${activeMeditation ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="bg-[#433422] text-white px-6 py-5 rounded-[40px] flex items-center justify-between shadow-2xl backdrop-blur-md bg-opacity-95">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPlaying ? 'bg-[#D4A373]/20 animate-pulse-slow' : 'bg-white/5'}`}>
              <Sun size={20} className={isPlaying ? "text-[#D4A373]" : "text-white/40"} />
            </div>
            <div>
              <p className="text-[10px] font-sans tracking-[0.3em] font-bold opacity-40">SOUL STILLNESS</p>
              <p className="text-base font-serif italic">{activeMeditation?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="p-2 hover:scale-110 transition-transform">
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button onClick={() => { setActiveMeditation(null); setIsPlaying(false); }} className="p-2 opacity-30 hover:opacity-100 transition-opacity">
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@400;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background-color: #FDF9F3;
          margin: 0;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        /* Snap scroll styles */
        .snap-x {
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        
        .snap-center {
          scroll-snap-align: center;
        }
      `}</style>
    </div>
  );
};

export default App;