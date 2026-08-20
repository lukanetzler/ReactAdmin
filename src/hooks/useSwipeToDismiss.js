import { useRef, useState, useCallback } from 'react';

// Drag-down-to-close for bottom sheets.
//
// Attach `handleProps` to the small grab handle at the top of the sheet (not the
// whole panel) so it never fights with scrollable content inside — this is what
// makes it safe to retrofit onto sheets that already scroll internally. Attach
// `sheetStyle` to the sheet panel and `backdropStyle` to the scrim behind it.
//
// The sheet tracks the finger one-to-one, and on release it carries the motion
// the rest of the way off screen before unmounting, rather than blinking out
// from wherever the finger happened to let go. A quick flick throws it out even
// if it never travelled far. Uses native touch events (not a library) so the
// behaviour is identical in the Capacitor WebView and in mobile browsers.
export function useSwipeToDismiss(onClose, { threshold = 90, flickVelocity = 0.45 } = {}) {
  const startY = useRef(null);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);   // px per ms
  const dragY = useRef(0);
  const closingRef = useRef(false);

  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [exitMs, setExitMs] = useState(260);

  const onTouchStart = useCallback((e) => {
    if (closingRef.current) return;
    const y = e.touches[0].clientY;
    startY.current = y;
    lastY.current = y;
    lastT.current = performance.now();
    velocity.current = 0;
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || closingRef.current) return;
    const y = e.touches[0].clientY;
    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) velocity.current = (y - lastY.current) / dt;
    lastY.current = y;
    lastT.current = now;

    const delta = y - startY.current;
    // Downward tracks the finger exactly; upward gets heavy resistance so the
    // sheet feels anchored at the top of its travel instead of floating free.
    const next = delta > 0 ? delta : delta * 0.16;
    dragY.current = next;
    setTranslateY(next);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (closingRef.current) return;
    setDragging(false);
    const dragged = dragY.current;
    const v = velocity.current;
    startY.current = null;
    dragY.current = 0;

    if (dragged <= threshold && v <= flickVelocity) {
      setTranslateY(0); // not far enough, and not thrown — settle back
      return;
    }

    // Let the throw set the pace: a hard flick leaves quickly, a slow deliberate
    // drag glides out. translateY(100%) is the sheet's own height, so a
    // bottom-anchored panel lands exactly off screen without measuring it.
    closingRef.current = true;
    const speed = Math.max(Math.abs(v), 1.0);
    const ms = Math.round(Math.min(380, Math.max(160, 260 / speed)));
    setExitMs(ms);
    setClosing(true);

    window.setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      setTranslateY(0);
      onClose();
    }, ms);
  }, [onClose, threshold, flickVelocity]);

  const settle = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const transform = closing ? 'translateY(100%)' : `translateY(${translateY}px)`;
  const transition = dragging
    ? 'none'
    : closing
      ? `transform ${exitMs}ms ${settle}`
      : `transform 340ms ${settle}`;

  // The scrim thins out as the sheet is pulled away, so the whole surface feels
  // attached to the finger rather than just the panel.
  const progress = closing ? 1 : Math.min(1, Math.max(0, translateY) / 300);

  return {
    handleProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      // Stops the browser's own scroll / pull-to-refresh competing with the drag
      // on the handle itself, while the rest of the sheet is left untouched.
      style: { touchAction: 'none' },
    },
    sheetStyle: { transform, transition },
    backdropStyle: {
      opacity: 1 - progress * 0.9,
      transition: dragging ? 'none' : `opacity ${closing ? exitMs : 340}ms ${settle}`,
    },
  };
}
