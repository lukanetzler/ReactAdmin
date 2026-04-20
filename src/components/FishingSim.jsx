import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const W = 480, H = 617;
const WATER_Y = 318;
const ROD_PIVOT = { x: 221, y: 116 };
const CAST_DUR = 1.8;

function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

function spawnFish() {
  return {
    x: Math.random() * W * 0.75 + W * 0.08,
    baseY: WATER_Y + 40 + Math.random() * (H - WATER_Y - 80),
    phase: Math.random() * Math.PI * 2,
    spd: (0.22 + Math.random() * 0.38) * (Math.random() > 0.5 ? 1 : -1),
    size: 17 + Math.random() * 15,
    hue: 165 + Math.random() * 75,
    alive: true,
    catching: false,
    catchProgress: 0,
  };
}

export default function FishingSim({ onBack }) {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const scaleRef  = useRef(1);
  const [caughtCount, setCaughtCount] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle' | 'bite' | 'caught'

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    const ctx    = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    function resize() {
      const maxW = Math.min(window.innerWidth - 32, 360);
      const maxH = window.innerHeight - 140;
      scaleRef.current = Math.min(maxW / W, maxH / H);
      const s  = scaleRef.current;
      const cw = Math.round(W * s) + 'px';
      const ch = Math.round(H * s) + 'px';
      canvas.style.width  = cw; canvas.style.height = ch;
      wrap.style.width    = cw; wrap.style.height   = ch;
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Assets ───────────────────────────────────────────────────────────────
    const IMG  = {};
    const base = import.meta.env.BASE_URL;
    const SRCS = {
      scene:        `${base}fishing-sim/scene.png`,
      water_tile:   `${base}fishing-sim/water-tile.png`,
      surface_tile: `${base}fishing-sim/surface-tile.png`,
      barrel:       `${base}fishing-sim/barrel.png`,
      fisherman:    `${base}fishing-sim/fisherman.png`,
    };
    let loadedCount = 0;
    const total = Object.keys(SRCS).length;

    // ── Mutable game state (never trigger re-renders) ─────────────────────────
    let T = 0, prevTS = 0;
    let waterOff = 0, causticsOff = 0, surfaceOff = 0;
    let waterPat = null;
    let biteTimer = 0, biteActive = false, biteEscape = 0;
    let caught = 0;
    let gamePhase = 'idle';
    let castAnim  = null;
    let inspectorX = 0, inspectorY = 0, inspectorVisible = false;
    let copiedFlash = 0;
    const pool = Array.from({ length: 5 }, spawnFish);
    let rafId = null;

    // ── Helpers ───────────────────────────────────────────────────────────────
    function rodState() { return { tipX: ROD_PIVOT.x, tipY: ROD_PIVOT.y }; }

    function bobberState(t, vibrate) {
      const rod = rodState();
      const bob = Math.sin(t * 3.4) * 3;
      const vib = vibrate ? (Math.random() * 8 - 4) : 0;
      return { rod, x: rod.tipX + 25 + vib * 0.6, y: 365 + bob + vib * 0.4 };
    }

    function drawFish(f, t, alpha) {
      const fy = f.baseY + Math.sin(t * 0.85 + f.phase) * 7;
      const s  = f.size;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(f.x, fy);
      if (f.spd < 0) ctx.scale(-1, 1);
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.42, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${f.hue},52%,50%)`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.72, 0); ctx.lineTo(-s * 1.22, -s * 0.44); ctx.lineTo(-s * 1.22, s * 0.44); ctx.closePath();
      ctx.fillStyle = `hsl(${f.hue},48%,40%)`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 0.42); ctx.lineTo(s * 0.35, -s * 0.72); ctx.lineTo(-s * 0.15, -s * 0.42); ctx.closePath();
      ctx.fillStyle = `hsl(${f.hue},40%,45%)`; ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.54, -s * 0.07, s * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = '#111'; ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.56, -s * 0.09, s * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
    }

    function tryClick() {
      if (!biteActive) return;
      const b = bobberState(T, true);
      let best = null, bestD = Infinity;
      pool.forEach(f => {
        if (!f.alive || f.catching) return;
        const fy = f.baseY + Math.sin(T * 0.85 + f.phase) * 7;
        const d  = Math.hypot(f.x - b.x, fy - b.y);
        if (d < bestD) { bestD = d; best = f; }
      });
      if (best) {
        best.catching = true;
        best.catchProgress = 0;
        biteActive = false; biteTimer = 0; biteEscape = 0;
        gamePhase = 'caught';
        setStatus('caught');
      }
    }

    function triggerCast() { castAnim = { t: 0 }; tryClick(); }

    // ── Frame loop ────────────────────────────────────────────────────────────
    function frame(ts) {
      const dt = Math.min((ts - prevTS) * 0.001, 0.05);
      prevTS = ts;
      T = ts * 0.001;

      let animRetract = 0, animJump = 0, animLean = 0;
      if (castAnim) {
        castAnim.t += dt;
        const ct = castAnim.t;
        if (ct >= CAST_DUR) {
          castAnim = null;
          if (gamePhase === 'caught') { gamePhase = 'idle'; setStatus('idle'); }
        } else {
          if      (ct < 0.5) animRetract = easeInOut(ct / 0.5);
          else if (ct < 0.9) animRetract = 1;
          else               animRetract = 1 - easeInOut((ct - 0.9) / 0.9);
          animJump = Math.sin(ct / CAST_DUR * Math.PI) * 28;
          animLean = Math.sin(Math.min(ct / (CAST_DUR * 0.8), 1) * Math.PI) * 0.22;
        }
      }

      waterOff    = (waterOff    + dt * 22) % 56000;
      causticsOff = (causticsOff + dt * 40) % 56000;
      surfaceOff  = (surfaceOff  + dt * 18) % 12000;

      ctx.clearRect(0, 0, W, H);

      // 1 ── Background scene
      if (IMG.scene) ctx.drawImage(IMG.scene, 0, 0, W, H);
      else { ctx.fillStyle = '#7ec8e3'; ctx.fillRect(0, 0, W, H); }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 2 ── Sprites
      if (IMG.barrel) {
        const dw = 35, dh = Math.round(dw * 2346 / 1824);
        ctx.save();
        ctx.translate(137, 170);
        ctx.rotate(-animLean);
        ctx.drawImage(IMG.barrel, -dw / 2, -dh, dw, dh);
        ctx.restore();
      }
      if (IMG.fisherman) {
        const dh = 180, dw = Math.round(dh * 1824 / 2346);
        ctx.drawImage(IMG.fisherman, 158 - dw / 2, 216 - dh - animJump, dw, dh);
      }

      // 3 ── Deep water: dual-layer parallax
      ctx.save();
      ctx.beginPath(); ctx.rect(0, WATER_Y, W, H - WATER_Y); ctx.clip();
      ctx.fillStyle = 'rgba(18,52,100,0.75)';
      ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
      if (IMG.water_tile) {
        if (!waterPat) waterPat = ctx.createPattern(IMG.water_tile, 'repeat');
        waterPat.setTransform(new DOMMatrix().translate(-(waterOff % 560), 0));
        ctx.globalAlpha = 0.65; ctx.fillStyle = waterPat;
        ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
        waterPat.setTransform(new DOMMatrix().translate(-(causticsOff % 560), 0));
        ctx.globalAlpha = 0.35;
        ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
      }
      ctx.globalAlpha = 1; ctx.restore();

      // 4 ── Fish
      const b = bobberState(T, biteActive);
      let nearBobber = false;
      pool.forEach(f => {
        if (!f.alive) return;
        if (f.catching) {
          f.catchProgress += dt * 1.5;
          f.x     += (ROD_PIVOT.x - f.x)     * dt * 4;
          f.baseY += (ROD_PIVOT.y - f.baseY) * dt * 4;
          drawFish(f, T, Math.max(0, 1 - f.catchProgress * 1.8));
          if (f.catchProgress >= 0.65) {
            f.alive = false; f.catching = false;
            caught++;
            setCaughtCount(caught);
            setTimeout(() => pool.push(spawnFish()), 3500);
          }
          return;
        }
        f.x += f.spd * dt * 55;
        if (f.x > W + 70) f.x = -70;
        if (f.x < -70)    f.x = W + 70;
        drawFish(f, T, 0.72);
        const fy = f.baseY + Math.sin(T * 0.85 + f.phase) * 7;
        if (Math.hypot(f.x - b.x, fy - b.y) < 34) nearBobber = true;
      });

      if (nearBobber) {
        biteEscape = 0;
        if (!biteActive) {
          biteTimer += dt;
          if (biteTimer >= 2) { biteActive = true; gamePhase = 'bite'; setStatus('bite'); }
        }
      } else if (biteActive) {
        biteEscape += dt;
        if (biteEscape > 4) { biteActive = false; biteTimer = 0; biteEscape = 0; gamePhase = 'idle'; setStatus('idle'); }
      } else { biteTimer = 0; }

      // 5 ── Refraction overlay
      if (IMG.scene) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, WATER_Y, W, H - WATER_Y); ctx.clip();
        ctx.globalAlpha = 0.28;
        ctx.drawImage(IMG.scene, 2, 0, W, H);
        ctx.globalAlpha = 1; ctx.restore();
      }

      // 6 ── Surface water band
      if (IMG.surface_tile) {
        const SURF_TOP = 295, TS = 24, rows = 3;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, SURF_TOP, W, (WATER_Y - SURF_TOP) + 8); ctx.clip();
        const drawSurfLayer = (xOff, yAmp, yFreq, ySpd, alpha) => {
          ctx.globalAlpha = alpha;
          const x0 = -(xOff % TS) - TS;
          for (let x = x0; x < W + TS; x += TS) {
            const yWave = yAmp * Math.sin(yFreq * x + ySpd * T);
            for (let r = 0; r < rows; r++)
              ctx.drawImage(IMG.surface_tile, x, SURF_TOP + r * TS + yWave, TS, TS);
          }
        };
        drawSurfLayer(surfaceOff,        3.5, 0.06, 2.2, 0.45);
        drawSurfLayer(surfaceOff * 1.4,  6.0, 0.04, 1.8, 0.25);
        ctx.globalAlpha = 1; ctx.restore();
      }

      // 7 ── Fishing line + bobber
      const rod  = b.rod;
      const bobX = b.x + (rod.tipX - b.x) * animRetract;
      const bobY = b.y + (rod.tipY - b.y) * animRetract;
      ctx.beginPath();
      ctx.moveTo(rod.tipX, rod.tipY);
      ctx.quadraticCurveTo(
        (rod.tipX + bobX) / 2 + 6 * (1 - animRetract),
        (rod.tipY + bobY) / 2 + 18 * (1 - animRetract),
        bobX, bobY
      );
      ctx.strokeStyle = '#c8b89a'; ctx.globalAlpha = 0.9; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = 1;
      if (animRetract < 0.98) {
        ctx.beginPath();
        ctx.arc(bobX, bobY, 4 * (1 - animRetract * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = '#c0392b'; ctx.fill();
        ctx.strokeStyle = '#7b241c'; ctx.lineWidth = 1; ctx.stroke();
      }

      // 8 ── Coordinate inspector (toggle with I key)
      if (inspectorVisible) {
        const ix = inspectorX, iy = inspectorY;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,80,0.85)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(ix - 10, iy); ctx.lineTo(ix + 10, iy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix, iy - 10); ctx.lineTo(ix, iy + 10); ctx.stroke();
        ctx.setLineDash([]);
        const label = copiedFlash > 0 ? '✓ Copied!' : `(${ix}, ${iy})`;
        ctx.font = 'bold 11px "Courier New", monospace';
        const tw = ctx.measureText(label).width;
        const lx = Math.min(ix + 14, W - tw - 10), ly = Math.max(iy - 8, 18);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath(); ctx.roundRect(lx - 4, ly - 12, tw + 10, 18, 4); ctx.fill();
        ctx.fillStyle = copiedFlash > 0 ? '#7ee8a2' : '#ffff50';
        ctx.fillText(label, lx + 1, ly);
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W - 126, H - 22, 122, 16);
        ctx.fillStyle = '#aaa'; ctx.fillText('[I] toggle inspector', W - 122, H - 10);
        ctx.restore();
        if (copiedFlash > 0) copiedFlash -= dt;
      }

      rafId = requestAnimationFrame(frame);
    }

    // ── Event listeners ───────────────────────────────────────────────────────
    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      inspectorX = Math.round((e.clientX - rect.left) / scaleRef.current);
      inspectorY = Math.round((e.clientY - rect.top)  / scaleRef.current);
    };
    const onClick = () => {
      if (inspectorVisible) {
        navigator.clipboard?.writeText(`x: ${inspectorX}, y: ${inspectorY}`);
        copiedFlash = 1.8;
      }
      triggerCast();
    };
    const onTouch = e => { e.preventDefault(); triggerCast(); };
    const onKeyDown = e => { if (e.key === 'i' || e.key === 'I') inspectorVisible = !inspectorVisible; };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    // ── Load assets then start loop ───────────────────────────────────────────
    Object.entries(SRCS).forEach(([k, src]) => {
      const img = new Image();
      img.src = src;
      img.onload  = () => { IMG[k] = img; if (++loadedCount === total) { rafId = requestAnimationFrame(frame); } };
      img.onerror = () => { IMG[k] = null; if (++loadedCount === total) { rafId = requestAnimationFrame(frame); } };
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const statusText = status === 'bite' ? '!! BITE !!' : status === 'caught' ? '★  CAUGHT!' : '~ Waiting...';

  return (
    <div className="min-h-screen bg-[#FDF9F3] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-[360px] bg-[#F4EFE6] rounded-[40px] overflow-hidden shadow-sm">

        {/* Arch header */}
        <div className="bg-[#FDF9F3] px-8 pt-10 pb-16 text-center relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-10 left-6 p-1 text-[#433422]/35 hover:text-[#433422] transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
          )}
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#D4A373] uppercase mb-3">PrayVail</p>
          <h1 className="text-3xl font-serif leading-tight">
            Calm<br /><em className="italic text-[#D4A373]">Fishing</em>
          </h1>
          <div
            className="absolute left-0 right-0 h-16 bg-[#F4EFE6]"
            style={{ bottom: -30, borderTopLeftRadius: '100%', borderTopRightRadius: '100%' }}
          />
        </div>

        {/* Canvas area */}
        <div ref={wrapRef} className="relative mx-auto">
          <canvas
            ref={canvasRef}
            style={{ display: 'block', imageRendering: 'pixelated', borderRadius: '12px 12px 0 0' }}
          />
          {/* Status HUD */}
          <div className="absolute top-0 left-0 right-0 flex justify-start p-3 pointer-events-none">
            <div className={`bg-[rgba(253,249,243,0.82)] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors ${
              status === 'bite'   ? 'text-[#c0392b] animate-pulse' :
              status === 'caught' ? 'text-[#5a7a4a]' :
              'text-[#433422]'
            }`}>
              {statusText}
            </div>
          </div>
          {/* Top fade */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{ height: 56, background: 'linear-gradient(to top, transparent, #F4EFE6)', borderRadius: '12px 12px 0 0' }}
          />
          {/* Bottom fade */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: 72, background: 'linear-gradient(to bottom, transparent, #F4EFE6)' }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 pt-4 pb-7">
          <span className="text-[9px] font-bold tracking-[0.35em] uppercase text-[#433422]/35">Caught</span>
          <span className="font-serif text-[22px] text-[#433422]">{caughtCount}</span>
        </div>

      </div>
    </div>
  );
}
