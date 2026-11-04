import React from 'react';
import { useCountUp } from './useCountUp.js';
import { useInView } from './useInView.js';

/** Counts up when scrolled into view. `format` receives the in-flight number. */
export default function AnimatedNumber({ value, format = v => Math.round(v).toLocaleString('en-IN'), duration = 1300, delay = 0, empty = '—', className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const v = useCountUp(value, { duration, delay, enabled: inView });
  return <span ref={ref} className={`ox-num ${className}`}>{v == null ? empty : format(v)}</span>;
}
