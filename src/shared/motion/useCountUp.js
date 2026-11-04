import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animates from the previously shown number to `target`.
 * Returns null while target is null/NaN so callers can render "—" instead of a fake 0.
 */
export function useCountUp(target, { duration = 1300, delay = 0, enabled = true } = {}) {
  const valid = target != null && Number.isFinite(Number(target));
  const to = valid ? Number(target) : null;
  const [value, setValue] = useState(valid && (!enabled || reduced()) ? to : valid ? 0 : null);
  const from = useRef(value ?? 0);

  useEffect(() => {
    if (to == null) { setValue(null); from.current = 0; return undefined; }
    if (!enabled || reduced()) { setValue(to); from.current = to; return undefined; }
    let raf; let start = null;
    const begin = from.current;
    const timer = window.setTimeout(() => {
      const tick = now => {
        if (start == null) start = now;
        const p = Math.min(1, (now - start) / duration);
        const v = begin + (to - begin) * easeOutExpo(p);
        from.current = v; setValue(v);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [to, duration, delay, enabled]);

  return value;
}
