export default function MeditationSelector({ onSelectLife, onSelectTwilight }) {
  return (
    <section>
      <div className="relative overflow-hidden rounded-[28px] select-none" style={{ aspectRatio: '1 / 1' }}>

        {/* Day half — The Garden of Life */}
        <div onClick={() => onSelectLife(null)}
          className="absolute inset-0 flex flex-col items-center justify-start active:opacity-90 transition-opacity cursor-pointer"
          style={{
            background: 'linear-gradient(180deg,#FDF9F3 0%,#F0E8DC 100%)',
            clipPath: 'polygon(0 0,100% 0,100% 42%,0 58%)',
            paddingTop: 60,
          }}>

          {/* Botanical texture */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            fill="none" stroke="rgba(160,130,90,0.13)" strokeLinecap="round" strokeLinejoin="round">
            {/* Left stem with two leaves */}
            <path d="M 10 58 C 9 48 12 38 8 22" strokeWidth="0.9" />
            <path d="M 9 44 C 14 40 20 36 18 29" strokeWidth="0.8" />
            <ellipse cx="18.5" cy="28.5" rx="4.5" ry="2.2" transform="rotate(-35 18.5 28.5)" strokeWidth="0.7" />
            <path d="M 8.5 32 C 3 28 1 22 4 16" strokeWidth="0.8" />
            <ellipse cx="4.2" cy="15.5" rx="4" ry="2" transform="rotate(20 4.2 15.5)" strokeWidth="0.7" />

            {/* Right stem with leaves */}
            <path d="M 90 55 C 91 44 88 33 92 18" strokeWidth="0.9" />
            <path d="M 91 40 C 86 35 80 32 82 24" strokeWidth="0.8" />
            <ellipse cx="81.5" cy="23.5" rx="4.5" ry="2.2" transform="rotate(40 81.5 23.5)" strokeWidth="0.7" />
            <path d="M 91.5 28 C 97 24 99 17 96 11" strokeWidth="0.8" />
            <ellipse cx="95.8" cy="10.5" rx="4" ry="2" transform="rotate(-25 95.8 10.5)" strokeWidth="0.7" />

            {/* Top-left corner sprig */}
            <path d="M 2 12 C 6 8 12 6 16 2" strokeWidth="0.75" />
            <ellipse cx="10" cy="5" rx="3.5" ry="1.6" transform="rotate(-50 10 5)" strokeWidth="0.65" />

            {/* Loose floating petal — upper right */}
            <path d="M 76 6 C 79 3 84 4 82 9 C 80 13 74 11 76 6 Z" strokeWidth="0.65" />

            {/* Small ground herbs — bottom centre, partially clipped */}
            <path d="M 44 62 C 44 54 46 48 44 42" strokeWidth="0.75" />
            <path d="M 44 52 C 48 48 52 46 50 40" strokeWidth="0.7" />
            <path d="M 44 46 C 40 42 36 40 38 34" strokeWidth="0.7" />
            <path d="M 56 60 C 56 52 58 45 55 38" strokeWidth="0.75" />
          </svg>

          <svg width="36" height="36" viewBox="0 0 64 64" style={{ marginBottom: 9, position: 'relative', zIndex: 1 }}>
            <circle cx="32" cy="32" r="14" fill="#D4A373" />
            <g stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round">
              <line x1="32" y1="4" x2="32" y2="12" /><line x1="32" y1="52" x2="32" y2="60" />
              <line x1="4" y1="32" x2="12" y2="32" /><line x1="52" y1="32" x2="60" y2="32" />
              <line x1="11.5" y1="11.5" x2="17" y2="17" /><line x1="47" y1="47" x2="52.5" y2="52.5" />
              <line x1="52.5" y1="11.5" x2="47" y2="17" /><line x1="17" y1="47" x2="11.5" y2="52.5" />
            </g>
          </svg>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 700, position: 'relative', zIndex: 1 }}>The Garden of Life</span>
        </div>

        {/* Night half — Twilight Space */}
        <div onClick={() => onSelectTwilight(null)}
          className="absolute inset-0 flex flex-col items-center justify-end active:opacity-90 transition-opacity cursor-pointer"
          style={{
            background: 'linear-gradient(180deg,#3a2e1e 0%,#433422 100%)',
            clipPath: 'polygon(0 58%,100% 42%,100% 100%,0 100%)',
            paddingBottom: 60,
          }}>
          {[[52, 120],[228, 95],[170, 140],[96, 160],[290, 130]].map(([l, b], i) => (
            <div key={i} style={{ position: 'absolute', left: l, bottom: b, width: i % 2 === 0 ? 6 : 4, height: i % 2 === 0 ? 6 : 4, borderRadius: '50%', backgroundColor: '#FDF9F3', opacity: 0.55 + i * 0.08 }} />
          ))}
          <svg width="32" height="32" viewBox="0 0 60 60" style={{ marginBottom: 9, position: 'relative', zIndex: 1 }}>
            <path d="M38 8 C26 10 17 21 17 34 C17 47 27 57 40 58 C29 60 17 55 10 45 C2 33 5 17 17 8 C23 4 31 3 38 8 Z" fill="#FDF9F3" />
          </svg>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4A373', fontWeight: 700, position: 'relative', zIndex: 1 }}>The Night Sky</span>
        </div>

        {/* Diagonal divider */}
        <div style={{ position: 'absolute', top: '50%', left: '-5%', right: '-5%', height: 1, backgroundColor: 'rgba(67,52,34,0.22)', transform: 'translateY(-50%) rotate(-9deg)', pointerEvents: 'none' }} />
      </div>
    </section>
  );
}
