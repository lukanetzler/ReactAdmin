import { useRef } from 'react';
import { List, Lock } from 'lucide-react';

const ResourceCard = ({
  title, label, duration, color = '#E9DCC9', imageUrl = '',
  blank = false, coming = false,
  type = 'single', tier = 'free',
  inPath = false, completed = false, lockedToday = false,
  onClick, onLongPress, onContextMenu,
}) => {
  const longPressTimer = useRef(null);

  const handleTouchStart = () => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => { onLongPress(); }, 500);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

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
  const isPlaylist = type === 'playlist';

  return (
    <div
      onClick={lockedToday ? undefined : onClick}
      onContextMenu={lockedToday ? undefined : onContextMenu}
      onTouchStart={lockedToday ? undefined : handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      className={`aspect-square rounded-[20px] overflow-hidden relative transition-transform select-none ${!lockedToday && onClick ? 'active:scale-[0.97] cursor-pointer' : ''} ${inPath && !lockedToday ? 'ring-2 ring-[#D4A373]' : ''} ${isSupporter || lockedToday ? 'opacity-60' : ''}`}
      style={{ backgroundColor: color }}
    >
      {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />}

      {lockedToday && <div className="absolute inset-0 bg-[#FDF9F3]/40 backdrop-blur-[2px]" />}

      {isPlaylist && !isSupporter && !lockedToday && (
        <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <List size={10} className="text-white" />
        </div>
      )}
      {isSupporter && (
        <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <Lock size={9} className="text-white/80" />
        </div>
      )}
      {lockedToday && (
        <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <Lock size={9} className="text-white/80" />
        </div>
      )}
      {(coming || isSupporter || completed || lockedToday) && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={`text-[8px] font-bold tracking-widest backdrop-blur-sm px-2 py-1 rounded-full ${completed && !coming && !isSupporter && !lockedToday ? 'bg-[#8E9775]/70 text-white' : lockedToday ? 'bg-black/20 text-white/80' : 'bg-black/20 text-white/80'}`}>
            {lockedToday ? 'TOMORROW' : completed && !coming && !isSupporter ? '✓ DONE' : isSupporter ? 'SUPPORTER' : 'SOON'}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 px-2.5 py-2 pr-9 backdrop-blur-md bg-black/30 border-t border-white/10">
        {label && <p className="text-[7px] font-bold tracking-widest mb-0.5 text-white/60">{label}</p>}
        <p className="text-[10px] font-serif leading-snug text-white">{title}</p>
        {duration && <p className="text-[8px] mt-0.5 font-bold text-white/55">{duration}</p>}
      </div>
    </div>
  );
};

export default ResourceCard;
