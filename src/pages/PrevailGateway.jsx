import { useState } from 'react';
import {
  Compass,
  User,
  ArrowRight,
  Leaf,
  Sparkles
} from 'lucide-react';
import prayvailLogo from '../assets/prayvail-logo-blank.webp';

const PrevailGateway = ({ onBeginWalk, onEnterSanctuary }) => {
  const [hoveredPath, setHoveredPath] = useState(null);

  return (
    <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans overflow-hidden relative">

      {/* 1. Meditative Window (Top Half) */}
      <section className="relative h-[45%] flex flex-col items-center justify-center px-10 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full bg-[#E9DCC9]/30 blur-3xl animate-pulse" />

        {/* Branding */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border border-[#D4A373]/20 flex items-center justify-center mb-6 bg-white/40 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 rounded-full border border-[#D4A373]/10 animate-ping opacity-20" />
            <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-serif tracking-[0.3em] uppercase mb-3">PRAYVAIL</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#D4A373] font-bold">Mindfulness in Christ</p>
        </div>

        {/* Arched Divider */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-[#FDF9F3] rounded-t-[100%] scale-x-125" />
      </section>

      {/* 2. Choice Paths (Bottom Half) */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 pb-12 relative z-10">
        <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Path A: New User */}
        <button
          onClick={onBeginWalk}
          onMouseEnter={() => setHoveredPath('new')}
          onMouseLeave={() => setHoveredPath(null)}
          className={`group relative flex items-center justify-between p-8 rounded-[40px] border-2 transition-all duration-500 text-left ${
            hoveredPath === 'new'
              ? 'bg-white border-[#D4A373] shadow-[0_8px_40px_-8px_rgba(212,163,115,0.35)] -translate-y-1'
              : 'bg-[#FAF7F0] border-transparent shadow-none'
          }`}
        >
          {/* Decorative element clipped inside its own layer */}
          <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
            <Sparkles className={`absolute -right-4 -top-4 w-28 h-28 text-[#D4A373]/10 transition-opacity duration-500 ${hoveredPath === 'new' ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div className="flex gap-6 items-center">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              hoveredPath === 'new' ? 'bg-[#D4A373] text-white scale-110' : 'bg-white text-[#D4A373]'
            }`}>
              <Compass size={32} strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4A373] uppercase block mb-1">New Journey</span>
              <h3 className="text-2xl font-serif">Begin My Path</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[160px]">Personalize your sanctuary and start fresh.</p>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
            hoveredPath === 'new' ? 'bg-[#D4A373] border-[#D4A373] text-white' : 'border-gray-200 text-gray-300'
          }`}>
            <ArrowRight size={20} />
          </div>
        </button>

        {/* Path B: Returning User */}
        <button
          onClick={onEnterSanctuary}
          onMouseEnter={() => setHoveredPath('return')}
          onMouseLeave={() => setHoveredPath(null)}
          className={`group relative flex items-center justify-between p-8 rounded-[40px] border-2 transition-all duration-500 text-left ${
            hoveredPath === 'return'
              ? 'bg-white border-[#8E9775] shadow-[0_8px_40px_-8px_rgba(142,151,117,0.35)] -translate-y-1'
              : 'bg-[#FAF7F0] border-transparent shadow-none'
          }`}
        >
          {/* Decorative element clipped inside its own layer */}
          <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
            <Leaf className={`absolute -right-4 -top-4 w-28 h-28 text-[#8E9775]/10 transition-opacity duration-500 ${hoveredPath === 'return' ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div className="flex gap-6 items-center">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              hoveredPath === 'return' ? 'bg-[#8E9775] text-white scale-110' : 'bg-white text-[#8E9775]'
            }`}>
              <User size={32} strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#8E9775] uppercase block mb-1">Returning</span>
              <h3 className="text-2xl font-serif">Enter Sanctuary</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[160px]">Pick up where you left off with God.</p>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
            hoveredPath === 'return' ? 'bg-[#8E9775] border-[#8E9775] text-white' : 'border-gray-200 text-gray-300'
          }`}>
            <ArrowRight size={20} />
          </div>
        </button>

        </div>
      </section>

      {/* 3. Footer Verse */}
      <footer className="px-8 pb-10 text-center animate-fade-in-delayed">
        <p className="text-gray-400 text-xs italic leading-relaxed">
          "I am the way, the truth, and the life."
          <span className="block mt-1 font-bold not-italic opacity-40 uppercase tracking-widest text-[9px]">John 14:6</span>
        </p>
      </footer>

      {/* Abstract Background Elements */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 rounded-full bg-[#D4A373]/5 blur-3xl -z-10" />
      <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 rounded-full bg-[#8E9775]/5 blur-3xl -z-10" />
    </div>
  );
};

export default PrevailGateway;
