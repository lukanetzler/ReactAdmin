import { useRef, useState, useCallback } from 'react';

// Drag-down-to-close for bottom sheets. Attach `handleProps` to the small grab
// handle at the top of the sheet (not the whole panel) so it never fights with
// scrollable content inside — this is what makes it safe to retrofit onto sheets
// that already scroll internally. Attach `sheetStyle` to the sheet panel itself
// so it visually follows the finger. Uses native touch events (not a library)
// so behaviour is identical in the Capacitor WebView and mobile browsers.
export function useSwipeToDismiss(onClose, { threshold = 90 } = {}) {
  const startY = useRef(null);
  const dragY = useRef(0);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      dragY.current = delta;
      setTranslateY(delta);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    setDragging(false);
    const dragged = dragY.current;
    dragY.current = 0;
    startY.current = null;
    if (dragged > threshold) {
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [onClose, threshold]);

  return {
    // Spread onto the small grab handle only — touchAction: 'none' stops the browser's
    // own scroll/pull-to-refresh gesture from competing with the drag right there,
    // while the rest of the sheet (which may scroll internally) is left untouched.
    handleProps: { onTouchStart, onTouchMove, onTouchEnd, style: { touchAction: 'none' } },
    sheetStyle: {
      transform: `translateY(${translateY}px)`,
      transition: dragging ? 'none' : 'transform 0.25s ease-out',
    },
  };
}
