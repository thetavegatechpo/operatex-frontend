import React from 'react';
import { useInView } from './useInView.js';

/** Fade/slide-in wrapper. `delay` in ms gives a stagger across siblings. */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView({ threshold: 0.08 });
  return <Tag ref={ref} className={`ox-reveal ${inView ? 'is-in' : ''} ${className}`} style={{ '--rv-delay': `${delay}ms` }} {...rest}>{children}</Tag>;
}
