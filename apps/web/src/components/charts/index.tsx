import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface Datum {
  label: string;
  value: number;
}

/** Rounded bar chart: soft bars with the leading values highlighted (as in the design reference). */
export function BarChart({ data, height = 150, highlight = 'max', valueSuffix = '', className, colors }: { data: Datum[]; height?: number; highlight?: 'max' | 'all' | number[]; valueSuffix?: string; className?: string; colors?: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = Math.ceil(max / 5) * 5 || 5;
  const top = [...data].map((d, i) => ({ v: d.value, i })).sort((a, b) => b.v - a.v).slice(0, Math.max(1, Math.ceil(data.length / 2.5))).map((x) => x.i);
  const isHi = (i: number) => (highlight === 'all' ? true : highlight === 'max' ? top.includes(i) : highlight.includes(i));
  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex flex-col justify-between pb-6 text-[10.5px] font-semibold text-muted tabular-nums" style={{ height }}>
        {[nice, Math.round(nice * 0.66), Math.round(nice * 0.33)].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-line" />
          ))}
        </div>
        <div className="relative flex items-end justify-around gap-2" style={{ height: height - 24 }}>
          {data.map((d, i) => {
            const h = Math.max(6, (d.value / nice) * (height - 24));
            const hi = isHi(i);
            return (
              <div key={i} className="relative flex h-full flex-1 items-end justify-center" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {hover === i && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="absolute z-10 whitespace-nowrap rounded-lg bg-fg px-2 py-1 text-[11px] font-bold text-bg shadow-lift" style={{ bottom: h + 8 }}>
                    {d.value}
                    {valueSuffix}
                  </motion.div>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('w-full max-w-10 rounded-xl transition-colors', hi ? 'bg-gradient-to-t from-brand-600 to-brand-400 shadow-brand' : 'bg-brand-200/70 dark:bg-brand-500/25', hover === i && !hi && 'bg-brand-300 dark:bg-brand-500/40')}
                  style={colors?.[i] ? { background: colors[i] } : undefined}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-around gap-2">
          {data.map((d, i) => (
            <span key={i} className="flex-1 truncate text-center text-[10.5px] font-semibold text-muted">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DonutChart({ data, size = 160, thickness = 18, center, className }: { data: (Datum & { color: string })[]; size?: number; thickness?: number; center?: React.ReactNode; className?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row sm:gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-panel" />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const gap = data.length > 1 && d.value > 0 ? 3 : 0;
            const el = (
              <motion.circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: -offset }}
                transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
      </div>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-fg-soft">{d.label}</span>
            <span className="font-bold tabular-nums text-fg">{d.value}</span>
            <span className="w-10 text-right text-xs tabular-nums text-muted">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineChart({ data, height = 180, min, max, className, format = (v: number) => String(v) }: { data: Datum[]; height?: number; min?: number; max?: number; className?: string; format?: (v: number) => string }) {
  const id = useId().replace(/:/g, '');
  const W = 600;
  const H = height;
  const pad = { l: 8, r: 8, t: 16, b: 28 };
  const lo = min ?? Math.min(...data.map((d) => d.value)) * 0.9;
  const hi = max ?? Math.max(...data.map((d) => d.value)) * 1.05;
  const pts = useMemo(
    () =>
      data.map((d, i) => ({
        x: pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (data.length - 1)) * (W - pad.l - pad.r)),
        y: pad.t + (1 - (d.value - lo) / (hi - lo || 1)) * (H - pad.t - pad.b),
        ...d,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, lo, hi, H],
  );
  if (!data.length) return null;
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');
  const area = `${path} L ${pts[pts.length - 1].x} ${H - pad.b} L ${pts[0].x} ${H - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn('h-auto w-full overflow-visible', className)}>
      <defs>
        <linearGradient id={`lg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7f6af3" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7f6af3" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad.l} x2={W - pad.r} y1={pad.t + t * (H - pad.t - pad.b)} y2={pad.t + t * (H - pad.t - pad.b)} className="stroke-line" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
      ))}
      <motion.path d={area} fill={`url(#lg-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} />
      <motion.path d={path} fill="none" stroke="#6a58e6" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
      {pts.map((p, i) => (
        <g key={i}>
          <motion.circle cx={p.x} cy={p.y} r={5} fill="var(--card)" stroke="#6a58e6" strokeWidth={3} vectorEffect="non-scaling-stroke" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.08 }} />
          <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-fg text-[11px] font-bold">
            {format(p.value)}
          </text>
          <text x={p.x} y={H - 6} textAnchor="middle" className="fill-muted text-[10.5px] font-semibold">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Horizontal progress list, e.g. per-subject performance */
export function BarList({ data, max = 100, suffix = '', colorFor }: { data: (Datum & { hint?: string })[]; max?: number; suffix?: string; colorFor?: (d: Datum) => string }) {
  return (
    <ul className="space-y-3.5">
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="truncate font-semibold text-fg-soft">{d.label}</span>
            <span className="shrink-0 font-bold tabular-nums text-fg">
              {d.value}
              {suffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-panel">
            <motion.div className="h-full rounded-full" style={{ background: colorFor?.(d) ?? 'linear-gradient(90deg,#9d88fc,#6a58e6)' }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (d.value / max) * 100)}%` }} transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
