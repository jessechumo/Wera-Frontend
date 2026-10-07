import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compact, money } from '../lib/format';
import type { DayCount, UsageDay } from '../api/types';

const AXIS_TICK = {
  fill: '#5B6173',
  fontSize: 10,
  fontFamily: '"Geist Mono", monospace',
} as const;

/** Series colors for the stacked token chart, also used by its legend. */
const TOKEN_SERIES: [string, string][] = [
  ['cached input', '#7C9CFF'],
  ['uncached input', '#41537A'],
  ['output', '#3DDC97'],
];

interface TipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

/** Tooltip styled like the rest of the UI: dark card, mono values. */
function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  format: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-xl">
      <div className="font-mono text-[10px] text-faint">{label}</div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto pl-4 font-mono tabular-nums text-text">
              {format(Number(p.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortDay(day: string): string {
  return day.slice(5); // "10-07"
}

/** New jobs per day, last 14 days (from /api/stats). */
export function NewJobsChart({ data }: { data: DayCount[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.045)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={<ChartTip format={(v) => String(v)} />}
          />
          <Bar dataKey="count" name="new jobs" fill="#FF7A59" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tokens per day, stacked: uncached input / cached input / output. */
export function TokensChart({ data }: { data: UsageDay[] }) {
  const rows = data.map((d) => ({
    day: d.day,
    'cached input': d.cached_tokens,
    'uncached input': Math.max(d.prompt_tokens - d.cached_tokens, 0),
    output: d.completion_tokens,
  }));
  return (
    <>
      <div className="mb-1 flex flex-wrap gap-3 px-1">
        {TOKEN_SERIES.map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5 text-[11px] text-faint">
            <span className="size-1.5 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
      <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.045)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => compact(v)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={<ChartTip format={compact} />}
          />
          <Bar dataKey="cached input" stackId="t" fill="#7C9CFF" maxBarSize={28} />
          <Bar dataKey="uncached input" stackId="t" fill="#41537A" maxBarSize={28} />
          <Bar dataKey="output" stackId="t" fill="#3DDC97" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  );
}

/** LLM cost per day. */
export function CostChart({ data }: { data: UsageDay[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF7A59" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#FF7A59" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.045)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v: number) => money(v)}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
            content={<ChartTip format={money} />}
          />
          <Area
            type="monotone"
            dataKey="cost_usd"
            name="cost"
            stroke="#FF7A59"
            strokeWidth={2}
            fill="url(#costFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
