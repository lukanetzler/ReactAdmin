import { useRef } from 'react';
import { Lock, ChevronRight } from 'lucide-react';

const ResourceCard = ({
  title, label, duration, color = '#E9DCC9', imageUrl = '',
  blank = false, coming = false,
  type = 'single', tier = 'free',
  inPath = false, completed = false,
  horizontal = false,
  onClick,
}) => {
  const longPressTimer = useRef(null);

  if (blank) {
    return (
      <div className="aspect-square rounded-[20px] border-2 border-dashed border-[#E9DCC9] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#E9DCC9] flex items-center justify-center">
          <span className="text-[#433422]/20 text-xl leading-none font-light">+</span>
        </div>
      </div>
    );
  }

  const isSupporter = tier === 'supporter';

  if (horizontal) {
    return (
      <div
        onClick={onClick}
        className={`flex rounded-[16px] overflow-hidden select-none transition-transform ${onClick ? 'active:scale-[0.98] cursor-pointer' : ''} ${isSupporter ? 'opacity-60' : ''}`}
      >
        {/* Left accent bar when in path */}
        {inPath && <div className="w-1 flex-shrink-0 bg-[#D4A373]" />}
        {/* Left swatch */}
        <div className="w-[72px] h-[72px] flex-shrink-0 relative" style={{ backgroundColor: color }}>
          {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        </div>
        {/* Text */}
        <div className={`flex-1 px-4 flex flex-col justify-center gap-0.5 min-w-0 ${inPath ? 'bg-[#EDE8DF]' : 'bg-[#F4EFE6]'}`}>
          {inPath
            ? <p className="text-[8px] font-bold tracking-widest text-[#D4A373] uppercase">CURRENT JOURNEY</p>
            : label && <p className="text-[8px] font-bold tracking-widest text-[#433422]/35 uppercase truncate">{label}</p>
          }
          <p className="text-sm font-serif text-[#433422] leading-snug truncate">{title}</p>
          {duration && <p className="text-[9px] text-[#433422]/40">{duration}</p>}
        </div>
        {/* Right side */}
        <div className={`flex items-center pr-4 pl-2 gap-1.5 ${inPath ? 'bg-[#EDE8DF]' : 'bg-[#F4EFE6]'}`}>
          {completed && !coming && !isSupporter && (
            <span className="text-[8px] font-bold text-[#8E9775]">✓</span>
          )}
          {isSupporter && <Lock size={9} className="text-[#433422]/30" />}
          <ChevronRight size={14} className="text-[#433422]/20" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onTouchStart={() => { longPressTimer.current = setTimeout(() => {}, 500); }}
      onTouchEnd={() => clearTimeout(longPressTimer.current)}
      onTouchMove={() => clearTimeout(longPressTimer.current)}
      className={`aspect-square rounded-[20px] overflow-hidden relative transition-transform select-none ${onClick ? 'active:scale-[0.97] cursor-pointer' : ''} ${isSupporter ? 'opacity-60' : ''}`}
      style={{ backgroundColor: color }}
    >
      {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />}

      {/* Warm overlay when in path */}
      {inPath && <div className="absolute inset-0 bg-[#D4A373]/15" />}

      {isSupporter && (
        <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <Lock size={9} className="text-white/80" />
        </div>
      )}
      {(coming || isSupporter || completed) && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`text-[8px] font-bold tracking-widest backdrop-blur-sm px-2 py-1 rounded-full ${completed && !coming && !isSupporter ? 'bg-[#8E9775]/70 text-white' : 'bg-black/20 text-white/80'}`}>
            {completed && !coming && !isSupporter ? '✓ DONE' : isSupporter ? 'SUPPORTER' : 'SOON'}
          </span>
        </div>
      )}

      {/* "On your path" badge — top-right, only when not occupied by other badges */}
      {inPath && !coming && !isSupporter && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="text-[8px] font-bold tracking-widest px-2 py-1 rounded-full bg-[#D4A373] text-white">
            CURRENT JOURNEY
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 px-2.5 py-2 rounded-b-[20px]" style={{ backgroundColor: color ? `${color}E6` : 'rgba(0,0,0,0.3)' }}>
        {label && <p className="text-[7px] font-bold tracking-widest mb-0.5 text-white/60">{label}</p>}
        <p className="text-[10px] font-serif leading-snug text-white">{title}</p>
        {duration && <p className="text-[8px] mt-0.5 font-bold text-white/55">{duration}</p>}
      </div>
    </div>
  );
};

export default ResourceCard;
