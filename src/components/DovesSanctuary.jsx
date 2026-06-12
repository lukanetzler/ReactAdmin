import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Feather, Sun, Wind, Trash2, X } from 'lucide-react';
import { addJournalEntry } from '../services/journal';

const DEFAULT_AFFIRMATIONS = [
  "Your presence has a beautiful way of grounding those around you.",
  "You are doing much better than your anxious thoughts let you believe.",
  "You bring a quiet, unique light into every room you step into.",
  "Your resilience is gentle, elegant, and incredibly powerful.",
  "It is completely okay to pause, take a deep breath, and just exist right here.",
  "Your kindness is a healing balm in a world that can sometimes feel harsh.",
  "The universe is glad you are here, creating your own quiet rhythm.",
  "You have survived every single one of your hardest, heaviest days.",
  "You don't need to earn rest; you are allowed to simply breathe and be.",
  "There is a deep, quiet pool of courage living right inside your heart.",
  "The softness in your eyes is proof of the strength in your spirit.",
  "Your journey is uniquely yours — it is perfectly paced and unfolding beautifully.",
  "You are a magnificent work of art in continuous, gorgeous motion.",
  "Your vulnerability is not weakness; it is the raw truth of your courage.",
  "You are thoroughly, deeply, and unconditionally worthy of love.",
  "Slow down. You are exactly where you need to be in this precious moment.",
  "Your voice carries a soothing warmth that makes people feel truly heard.",
  "Even when you feel fragile, remember that water is soft and can carve canyons.",
  "Be patient with yourself; you are continuously blooming, petal by petal.",
  "Peace is not the absence of noise — it is your quiet strength within it.",
];

const DOVE_TYPES = [
  { name: 'Sacred Alabaster', wingColor: '#F4EFE6', bodyColor: '#FDF9F3', glow: 'rgba(212,163,115,0.4)' },
  { name: 'Sage Peace',       wingColor: '#A3AF85', bodyColor: '#8E9775', glow: 'rgba(142,151,117,0.4)' },
  { name: 'Terracotta Grace', wingColor: '#E3B689', bodyColor: '#D4A373', glow: 'rgba(212,163,115,0.5)' },
  { name: 'Morning Cream',    wingColor: '#F4EFE6', bodyColor: '#EADFC9', glow: 'rgba(212,163,115,0.3)' },
];

const BG = 'linear-gradient(180deg, #FDF9F3 0%, #F4EFE6 100%)';

export default function DovesSanctuary({ onBack, user }) {
  const canvasRef = useRef(null);
  const areaRef   = useRef(null);
  const gsRef     = useRef({ dove: null, particles: [], stars: [], currentDove: null, raf: null, onReveal: null, onFlyAway: null });

  const [stage, setStage]               = useState('playing'); // 'playing' | 'ending' | 'done'
  const [affirmation, setAffirmation]   = useState(null);
  const [showJournal, setShowJournal]   = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [sessionKept, setSessionKept]   = useState([]); // affirmations kept this session
  const [saving, setSaving]             = useState(false);

  // ── Dismiss affirmation ──────────────────────────────────────────────────
  const dismissAffirmation = useCallback((releaseDove = true) => {
    setAffirmation(null);
    const gs = gsRef.current;
    if (releaseDove && gs.currentDove) {
      gs.currentDove.el.style.opacity = '1';
      gs.currentDove.el.style.pointerEvents = 'auto';
      gs.currentDove.release();
      gs.currentDove = null;
    }
  }, []);

  // ── Keep affirmation ─────────────────────────────────────────────────────
  const keepAffirmation = useCallback((text) => {
    setSessionKept(prev => prev.includes(text) ? prev : [...prev, text]);
    const gs = gsRef.current;
    const cx = window.innerWidth / 2, cy = window.innerHeight * 0.6;
    for (let i = 0; i < 18; i++) gs.particles.push(makeParticle(cx, cy, 'rgba(142,151,117,0.7)'));
    dismissAffirmation();
  }, [dismissAffirmation]);

  // ── End walk ─────────────────────────────────────────────────────────────
  const endWalk = useCallback(() => {
    setStage('ending');
    setAffirmation(null);
    const gs = gsRef.current;
    if (gs.currentDove) {
      gs.currentDove.el.style.opacity = '0';
      gs.currentDove = null;
    }
    gs.dove?.flyAway();
  }, []);

  // ── Save to journal ──────────────────────────────────────────────────────
  const saveToJournal = useCallback(async () => {
    setSaving(true);
    const today = new Date();
    const dateISO = today.toISOString().split('T')[0];
    const dateDisplay = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const lines = sessionKept.length
      ? ['🕊️ Serenade of the Doves', '', ...sessionKept.map(t => `• "${t}"`)]
      : ['🕊️ Serenade of the Doves', '', 'A walk with the doves.'];
    try {
      await addJournalEntry(user?.uid ?? null, { dateISO, dateDisplay, reflection: lines.join('\n') });
    } catch (_) {}
    setSaving(false);
    onBack();
  }, [sessionKept, user, onBack]);

  // ── Game loop setup ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const area   = areaRef.current;
    if (!canvas || !area) return;

    const ctx2d = canvas.getContext('2d');
    const gs    = gsRef.current;

    gs.onReveal = (dove) => {
      setIntroVisible(false);
      const pool = [...DEFAULT_AFFIRMATIONS];
      const text = pool[Math.floor(Math.random() * pool.length)];
      dove.el.style.opacity = '0';
      dove.el.style.pointerEvents = 'none';
      setAffirmation({ text, doveName: dove.type.name, wingColor: dove.type.wingColor });
    };

    gs.onFlyAway = () => setStage('done');

    // Canvas sizing
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    // Stars
    function makeStar() {
      return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2.5 + 0.8, speed: Math.random() * 0.12 + 0.04, opacity: Math.random() * 0.35 + 0.1, wiggle: Math.random() * 100, wiggleSpeed: Math.random() * 0.008 + 0.002 };
    }
    gs.stars = Array.from({ length: 50 }, makeStar);

    function updateStar(s) {
      s.y -= s.speed; s.wiggle += s.wiggleSpeed; s.x += Math.sin(s.wiggle) * 0.08;
      if (s.y < -10) { Object.assign(s, makeStar()); s.y = canvas.height + 10; }
    }
    function drawStar(s) {
      ctx2d.save(); ctx2d.shadowBlur = 6; ctx2d.shadowColor = 'rgba(212,163,115,0.2)';
      ctx2d.fillStyle = `rgba(212,163,115,${s.opacity})`; ctx2d.beginPath(); ctx2d.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx2d.fill(); ctx2d.restore();
    }

    // ── Dove ──────────────────────────────────────────────────────────────
    class Dove {
      constructor() {
        this.type    = DOVE_TYPES[Math.floor(Math.random() * DOVE_TYPES.length)];
        this.w = 90; this.h = 90;
        this.param   = Math.random() * Math.PI * 2;
        this.speed   = 0.0035;
        this.x = window.innerWidth / 2; this.y = window.innerHeight / 2;
        this.angle   = 0; this.state = 'roaming';
        this.startX  = 0; this.startY = 0; this.startAngle = 0;
        this.targetX = 0; this.targetY = 0; this.progress = 0;
        this.flyOpacity = 1;

        this.el = document.createElement('div');
        this.el.className = 'absolute z-10 rounded-full cursor-pointer touch-none select-none';
        this.el.style.cssText = `width:${this.w}px;height:${this.h}px;left:${this.x}px;top:${this.y}px;filter:drop-shadow(0 4px 12px ${this.type.glow});transition:filter 0.5s;`;
        this.el.innerHTML = `
          <style>
            @keyframes flap-l{0%,100%{transform:rotate(0deg) scaleY(1)}50%{transform:rotate(-32deg) scaleY(0.4) skewX(10deg)}}
            @keyframes flap-r{0%,100%{transform:rotate(0deg) scaleY(1)}50%{transform:rotate(32deg) scaleY(0.4) skewX(-10deg)}}
            .dvl{transform-origin:52px 42px;animation:flap-l 0.9s ease-in-out infinite}
            .dvr{transform-origin:68px 42px;animation:flap-r 0.9s ease-in-out infinite}
          </style>
          <svg viewBox="0 0 120 120" width="100%" height="100%" style="pointer-events:none;user-select:none">
            <path class="dvl" d="M52 42 C40 22,10 25,5 45 C2 54,20 62,52 42 Z" fill="${this.type.wingColor}" stroke="rgba(67,52,34,0.15)" stroke-width="0.7"/>
            <path class="dvr" d="M68 42 C80 22,110 25,115 45 C118 54,100 62,68 42 Z" fill="${this.type.wingColor}" stroke="rgba(67,52,34,0.15)" stroke-width="0.7"/>
            <circle cx="60" cy="50" r="3" fill="#D4A373" opacity="0.65"/>
            <path class="dvb" d="M60 25 C50 35,54 48,56 60 C58 68,48 85,42 90 C50 88,55 85,60 80 C65 85,70 88,78 90 C72 85,62 68,64 60 C66 48,70 35,60 25 Z" fill="${this.type.bodyColor}"/>
            <polygon points="60,21 58,25 62,25" fill="#D4A373"/>
          </svg>`;

        const tap = (e) => {
          e.stopPropagation();
          if (this.state === 'roaming' || this.state === 'returning') this.flyToCenter();
        };
        this.el.addEventListener('mousedown', tap);
        this.el.addEventListener('touchstart', tap, { passive: false });
        area.appendChild(this.el);
      }

      setFlapSpeed(dur) {
        this.el.querySelectorAll('.dvl,.dvr').forEach(w => { w.style.animationDuration = `${dur}s`; });
      }

      flyToCenter() {
        gs.currentDove = this;
        this.state = 'flying';
        this.startX = this.x; this.startY = this.y; this.startAngle = this.angle;
        this.targetX = window.innerWidth / 2 - this.w / 2;
        this.targetY = window.innerHeight * 0.35 - this.h / 2;
        this.progress = 0;
        this.el.style.transform = 'scale(1.15)';
        for (let i = 0; i < 15; i++) gs.particles.push(makeParticle(this.x + 45, this.y + 45, this.type.glow));
      }

      flyAway() {
        this.state = 'departing';
        this.startX = this.x; this.startY = this.y; this.startAngle = this.angle;
        this.progress = 0;
        this.flyOpacity = 1;
        this.setFlapSpeed(0.4);
        for (let i = 0; i < 20; i++) gs.particles.push(makeParticle(this.x + 45, this.y + 45, this.type.glow));
      }

      release() {
        this.state = 'returning';
        this.startX = this.x; this.startY = this.y; this.startAngle = this.angle; this.progress = 0;
        this.type = DOVE_TYPES[Math.floor(Math.random() * DOVE_TYPES.length)];
        this.el.querySelector('.dvl')?.setAttribute('fill', this.type.wingColor);
        this.el.querySelector('.dvr')?.setAttribute('fill', this.type.wingColor);
        this.el.querySelector('.dvb')?.setAttribute('fill', this.type.bodyColor);
        this.el.style.filter = `drop-shadow(0 4px 12px ${this.type.glow})`;
        this.el.style.transform = 'scale(1)';
        for (let i = 0; i < 8; i++) gs.particles.push(makeParticle(this.x + 45, this.y + 45, this.type.glow));
      }

      update() {
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const A = window.innerWidth * 0.32, B = window.innerHeight * 0.16;
        const cx = window.innerWidth / 2, cy = window.innerHeight * 0.52;

        if (this.state === 'roaming') {
          this.param += this.speed;
          if (this.param > Math.PI * 2) this.param -= Math.PI * 2;
          this.x = cx + A * Math.sin(this.param) - this.w / 2;
          this.y = cy + B * Math.sin(2 * this.param) - this.h / 2;
          const vx = A * Math.cos(this.param), vy = 2 * B * Math.cos(2 * this.param);
          this.angle = Math.atan2(vy, vx) + Math.PI / 2;
          if (Math.random() < 0.08) gs.particles.push(makeParticle(this.x + 45, this.y + 45, this.type.glow));
          this.setFlapSpeed(1.0);

        } else if (this.state === 'flying') {
          this.progress += 0.015;
          if (this.progress < 1) {
            const t = ease(this.progress);
            this.x = this.startX + (this.targetX - this.startX) * t;
            this.y = this.startY + (this.targetY - this.startY) * t;
            this.angle = this.startAngle + (0 - this.startAngle) * t;
            if (Math.random() < 0.4) gs.particles.push(makeParticle(this.x + 45, this.y + 45, this.type.glow));
          } else {
            this.state = 'hovering'; this.x = this.targetX; this.y = this.targetY; this.angle = 0;
            gs.onReveal?.(this);
          }
          this.setFlapSpeed(0.45);

        } else if (this.state === 'hovering') {
          this.param += 0.025;
          this.y = (window.innerHeight * 0.35 - this.h / 2) + Math.sin(this.param) * 8;
          if (Math.random() < 0.06) gs.particles.push(makeParticle(this.x + 45, this.y + 45 + 12, this.type.glow));
          this.setFlapSpeed(2.0);

        } else if (this.state === 'returning') {
          this.param += this.speed;
          if (this.param > Math.PI * 2) this.param -= Math.PI * 2;
          const tx = cx + A * Math.sin(this.param) - this.w / 2;
          const ty = cy + B * Math.sin(2 * this.param) - this.h / 2;
          const tvx = A * Math.cos(this.param), tvy = 2 * B * Math.cos(2 * this.param);
          const ta = Math.atan2(tvy, tvx) + Math.PI / 2;
          this.progress += 0.02;
          if (this.progress < 1) {
            const t = ease(this.progress);
            this.x = this.startX + (tx - this.startX) * t;
            this.y = this.startY + (ty - this.startY) * t;
            this.angle = this.startAngle + (ta - this.startAngle) * t;
          } else { this.state = 'roaming'; }

        } else if (this.state === 'departing') {
          // Rise upward and fade out
          this.y -= 3.5;
          this.x += Math.sin(this.progress * 4) * 1.2;
          this.flyOpacity = Math.max(0, this.flyOpacity - 0.016);
          this.el.style.opacity = String(this.flyOpacity);
          if (Math.random() < 0.35) gs.particles.push(makeParticle(this.x + 45, this.y + 45, this.type.glow));
          if (this.flyOpacity <= 0) {
            this.state = 'gone';
            gs.onFlyAway?.();
          }
          this.setFlapSpeed(0.35);
        }

        if (this.state !== 'gone') {
          this.el.style.left = `${this.x}px`;
          this.el.style.top  = `${this.y}px`;
          const svg = this.el.querySelector('svg');
          if (svg) svg.style.transform = `rotate(${this.angle}rad)`;
        }
      }

      destroy() { if (this.el.parentNode) this.el.remove(); }
    }

    gs.dove = new Dove();

    const areaClick = (e) => {
      for (let i = 0; i < 6; i++) gs.particles.push(makeParticle(e.clientX, e.clientY, 'rgba(212,163,115,0.35)'));
    };
    area.addEventListener('click', areaClick);

    function tick() {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      const g = ctx2d.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, '#FDF9F3'); g.addColorStop(0.6, '#F4EFE6'); g.addColorStop(1, '#FDF9F3');
      ctx2d.fillStyle = g; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      gs.stars.forEach(s => { updateStar(s); drawStar(s); });
      gs.particles = gs.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.alpha -= p.decay;
        if (p.alpha <= 0) return false;
        ctx2d.save(); ctx2d.shadowBlur = 8; ctx2d.shadowColor = p.color;
        ctx2d.fillStyle = p.color.startsWith('rgba') ? p.color.replace(/[\d.]+\)$/, `${p.alpha})`) : `rgba(212,163,115,${p.alpha})`;
        ctx2d.beginPath(); ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx2d.fill(); ctx2d.restore();
        return true;
      });
      gs.dove?.update();
      gs.raf = requestAnimationFrame(tick);
    }
    gs.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(gs.raf);
      window.removeEventListener('resize', resize);
      area.removeEventListener('click', areaClick);
      gs.dove?.destroy();
      gs.dove = null; gs.particles = []; gs.stars = [];
    };
  }, []);

  // ── Done screen ───────────────────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <div className="fixed inset-0 flex flex-col font-sans overflow-y-auto" style={{ background: BG }}>
        <div className="pt-14 px-6 flex-shrink-0">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center">
            <ArrowLeft size={18} strokeWidth={1.5} color="#433422" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8">
          {/* Dove farewell icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.2)' }}>
            <Feather size={26} strokeWidth={1.5} style={{ color: '#D4A373' }} />
          </div>

          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-2">Your session is complete</p>
          <h2 className="text-3xl font-serif text-[#433422] text-center leading-snug mb-3">
            The doves<br /><em className="italic text-[#D4A373]">have spoken.</em>
          </h2>

          {sessionKept.length > 0 ? (
            <>
              <p className="text-xs text-[#433422]/40 mb-5 text-center">
                {sessionKept.length} affirmation{sessionKept.length > 1 ? 's' : ''} kept this walk
              </p>
              <div className="w-full space-y-2 mb-8">
                {sessionKept.map((text, i) => (
                  <div key={i} className="rounded-[18px] px-5 py-3.5 border-l-[3px]"
                    style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#D4A373' }}>
                    <p className="font-serif text-sm text-[#433422] leading-relaxed italic">"{text}"</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#433422]/40 font-serif italic text-center mb-10 max-w-[240px] leading-relaxed">
              "Be still, and know that I am God." — Psalm 46:10
            </p>
          )}
        </div>

        <div className="px-8 pb-14 space-y-3 flex-shrink-0">
          <button onClick={saveToJournal} disabled={saving}
            className="w-full py-5 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? 'SAVING...' : 'SAVE TO JOURNAL'}
          </button>
          <button onClick={onBack}
            className="w-full py-2 text-[10px] font-bold tracking-widest text-[#433422]/25 uppercase">
            Return without saving
          </button>
        </div>
      </div>
    );
  }

  // ── Playing / Ending ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden font-sans" style={{ color: '#433422' }}>
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      <div className="absolute top-[20%] left-[30%] w-72 h-72 rounded-full pointer-events-none z-0"
        style={{ backgroundColor: 'rgba(212,163,115,0.04)', filter: 'blur(100px)' }} />
      <div className="absolute bottom-[30%] right-[25%] w-80 h-80 rounded-full pointer-events-none z-0"
        style={{ backgroundColor: 'rgba(142,151,117,0.04)', filter: 'blur(100px)' }} />

      {/* Dove area */}
      <div ref={areaRef} className="absolute inset-0 z-10 overflow-hidden" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-5 pt-14 pb-4 flex justify-between items-center"
        style={{ background: 'linear-gradient(to bottom, rgba(253,249,243,0.85) 0%, transparent 100%)' }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(244,239,230,0.85)', backdropFilter: 'blur(20px)' }}>
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2">
          {sessionKept.length > 0 && (
            <button onClick={() => setShowJournal(true)}
              className="h-9 px-4 rounded-full flex items-center gap-2 text-[10px] font-bold tracking-widest"
              style={{ backgroundColor: 'rgba(244,239,230,0.85)', backdropFilter: 'blur(20px)' }}>
              <Feather size={13} strokeWidth={1.5} style={{ color: '#8E9775' }} />
              <span className="uppercase">{sessionKept.length}</span>
            </button>
          )}
          {stage === 'playing' && (
            <button onClick={endWalk}
              className="h-9 px-4 rounded-full text-[10px] font-bold tracking-widest uppercase"
              style={{ backgroundColor: 'rgba(244,239,230,0.85)', backdropFilter: 'blur(20px)', color: '#433422' }}>
              Done
            </button>
          )}
          {stage === 'ending' && (
            <div className="h-9 px-4 rounded-full flex items-center text-[10px] font-bold tracking-widest text-[#433422]/40 uppercase"
              style={{ backgroundColor: 'rgba(244,239,230,0.85)', backdropFilter: 'blur(20px)' }}>
              Farewell...
            </div>
          )}
        </div>
      </header>

      {/* Intro prompt */}
      {introVisible && stage === 'playing' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center pointer-events-none px-6 max-w-xs"
          style={{ opacity: 0, animation: 'fade-in 1.2s ease-out 0.5s forwards' }}>
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#8E9775] uppercase mb-2">Present Awareness</p>
          <p className="font-serif text-2xl text-[#433422] italic mb-4 leading-relaxed">"The air is thick with gentle wishes."</p>
          <p className="text-[11px] text-[#433422]/50 tracking-wider">Tap the glowing dove to begin</p>
        </div>
      )}

      {/* Arched horizon */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-20 pointer-events-none"
        style={{ borderTopLeftRadius: '100% 60px', borderTopRightRadius: '100% 60px', background: 'linear-gradient(to bottom, #F4EFE6, #FDF9F3)', borderTop: '1.5px solid rgba(212,163,115,0.2)' }}>
        <p className="text-[9px] font-bold tracking-[0.4em] text-[#8E9775]/40 text-center pt-4 uppercase">Serenade of the Doves</p>
      </div>

      {/* ── Affirmation card ────────────────────────────────────────────── */}
      {affirmation && stage === 'playing' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end items-center pb-28 px-5">
          <div className="w-full max-w-md rounded-[32px] p-8 text-center relative overflow-hidden"
            style={{ backgroundColor: 'rgba(244,239,230,0.96)', backdropFilter: 'blur(24px)', border: '1px solid rgba(212,163,115,0.2)', boxShadow: '0 16px 40px rgba(67,52,34,0.08)', opacity: 0, animation: 'fade-in 0.6s ease-out forwards' }}>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none"
              style={{ backgroundColor: affirmation.wingColor, filter: 'blur(60px)', opacity: 0.3 }} />

            <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-5 border"
              style={{ backgroundColor: '#F4EFE6', borderColor: 'rgba(212,163,115,0.3)' }}>
              <Feather size={18} strokeWidth={2} style={{ color: '#D4A373' }} />
            </div>

            <p className="font-serif text-xl text-[#433422] leading-relaxed mb-5 tracking-wide relative z-10">
              "{affirmation.text}"
            </p>


            <div className="flex gap-3 w-full">
              <button onClick={() => keepAffirmation(affirmation.text)}
                className="flex-1 py-3 px-4 rounded-full text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ backgroundColor: '#D4A373' }}>
                <Sun size={14} strokeWidth={2} />
                Keep
              </button>
              <button onClick={() => dismissAffirmation()}
                className="py-3 px-6 rounded-full text-[#433422]/70 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition-transform border"
                style={{ backgroundColor: '#F4EFE6', borderColor: 'rgba(67,52,34,0.1)' }}>
                Release
                <Wind size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session kept drawer ─────────────────────────────────────────── */}
      {showJournal && (
        <div className="absolute inset-0 z-40 flex">
          <div className="absolute inset-0 bg-[#433422]/15 backdrop-blur-sm" onClick={() => setShowJournal(false)} />
          <div className="relative z-10 w-full max-w-sm bg-[#FDF9F3] flex flex-col h-full shadow-xl">
            <div className="px-6 pt-14 pb-5 border-b border-[#433422]/10 flex justify-between items-center"
              style={{ backgroundColor: 'rgba(244,239,230,0.5)' }}>
              <div>
                <h2 className="font-bold text-sm tracking-wider uppercase">This Walk</h2>
                <p className="text-[10px] font-bold tracking-widest text-[#8E9775] uppercase mt-0.5">Affirmations kept</p>
              </div>
              <button onClick={() => setShowJournal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center border"
                style={{ backgroundColor: '#F4EFE6', borderColor: 'rgba(67,52,34,0.05)' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {sessionKept.map((text, i) => (
                <div key={i} className="rounded-[20px] p-4 border-l-[3px]"
                  style={{ backgroundColor: 'rgba(244,239,230,0.85)', borderColor: '#D4A373' }}>
                  <p className="font-serif text-sm text-[#433422] leading-relaxed italic">"{text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function makeParticle(x, y, color) {
  return { x, y, color, vx: (Math.random()-0.5)*1.2, vy: (Math.random()-0.5)*1.2+0.3, size: Math.random()*3+1, alpha: 1, decay: Math.random()*0.012+0.006 };
}
