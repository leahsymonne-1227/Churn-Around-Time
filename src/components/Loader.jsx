import { useEffect, useState } from 'react';

const SHAPES = [
  [[1,1],[2,1],[3,1],[4,1],[5,1],[1,2],[2,2],[3,2],[4,2],[5,2],[0,3],[1,3],[5,3],[6,3],[0,4],[1,4],[5,4],[6,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5]], // folder
  [[1,6],[2,5],[3,4],[4,3],[5,2],[6,1],[0,6],[1,5],[2,4],[3,3],[4,2],[5,1],[6,0],[1,7],[2,6],[3,5],[4,4],[5,3],[6,2],[7,1],[0,7],[7,0],[0,5],[2,7]], // pencil
  [[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[0,3],[1,3],[2,3],[4,3],[5,3],[6,3],[7,3],[1,1],[2,2],[4,4],[5,5],[5,1],[4,2],[2,4],[1,5],[1,6],[5,6]], // signal
];
const DOTS = 25;
const STEP = 14;

export function Loader({ label = 'Reading your files' }) {
  const [shape, setShape] = useState(0);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setInterval(() => setShape((n) => (n + 1) % SHAPES.length), 1050);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const points = SHAPES[shape];
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="morph-stage" aria-hidden="true">
        {Array.from({ length: DOTS }, (_, i) => {
          const [x, y] = points[i % points.length];
          const jitter = (i % 3) - 1;
          return (
            <i
              key={i}
              className={`morph-dot${i >= points.length ? ' morph-extra' : ''}`}
              style={{ '--x': `${(x + 0.5 + jitter * 0.08) * STEP}px`, '--y': `${(y + 0.5 - jitter * 0.08) * STEP}px`, '--delay': `${(i % 8) * 32}ms`, '--tone': i % 5 === 0 ? 'var(--ink)' : 'var(--accent-dot)' }}
            />
          );
        })}
      </div>
      <p className="loader-label">{label}…</p>
      <p className="hint">Your files stay in this browser.</p>
    </div>
  );
}
