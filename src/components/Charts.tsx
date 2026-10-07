import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compact, money } from '../lib/format';
import type { DayCount, UsageDay } from '../api/types';

const TOOLTIP_STYLE = {
  background: '#12141A',
  border: '1px solid #262A35',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#E8EAF0',
} as const;

const AXIS_TICK = { fill: '#5B6173', fontSize: 11 } as const;

function shortDay(day: string): string {
  return day.slice(5); // "10-07"
}

/** New jobs per day, last 14 days (from /api/stats). */
export function NewJobsChart({ data }: { data: DayCount[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#262A35" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#8A90A2' }}
          />
          <Bar dataKey="count" name="new jobs" fill="#FF7A59" radius={[4, 4, 0, 0]} maxBarSize={28} />
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
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#262A35" vertical={false} />
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
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#8A90A2' }}
            formatter={(value) => compact(Number(value))}
          />
          <Bar dataKey="cached input" stackId="t" fill="#7C9CFF" maxBarSize={28} />
          <Bar dataKey="uncached input" stackId="t" fill="#41537A" maxBarSize={28} />
          <Bar dataKey="output" stackId="t" fill="#3DDC97" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** LLM cost per day. */
export function CostChart({ data }: { data: UsageDay[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="#262A35" vertical={false} />
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
            width={54}
            tickFormatter={(v: number) => money(v)}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#8A90A2' }}
            formatter={(value) => money(Number(value))}
          />
          <Line
            type="monotone"
            dataKey="cost_usd"
            name="cost"
            stroke="#FF7A59"
            strokeWidth={2}
            dot={{ r: 3, fill: '#FF7A59', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
