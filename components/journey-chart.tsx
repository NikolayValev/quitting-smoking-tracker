"use client"

import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type JourneyPoint = {
  /** Epoch ms. The x axis is real time, not check-in order. */
  t: number
  cigarettes: number
}

const config = {
  cigarettes: { label: "Cigarettes", color: "var(--primary)" },
} satisfies ChartConfig

const tick = (t: number) =>
  new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

const full = (t: number) =>
  new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

/**
 * Cigarettes a day across the whole journey.
 *
 * An area rather than a line because the filled region is the point: it drains
 * to nothing and then runs flat along the baseline, so the shape says "this
 * stopped" without having to be read off the axis.
 *
 * The x axis is a real time scale, not the check-in index. Check-ins are daily
 * while cutting down and weekly once they stop, so plotting them evenly would
 * squeeze ten smoke-free weeks into the same width as three difficult ones —
 * flattering the hard part and hiding the achievement.
 *
 * One series, so no legend; the heading names it. The only direct label is the
 * first smoke-free day, the moment the chart exists to show. Everything else is
 * left to the axis and the tooltip, with the check-in list below carrying every
 * value for anyone who can use neither.
 *
 * Animation is off: it would replay on each mount with nothing to explain,
 * which is decoration rather than feedback.
 */
export function JourneyChart({
  data,
  quitAt,
}: {
  data: JourneyPoint[]
  quitAt: number | null
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="journeyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cigarettes)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-cigarettes)" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} strokeOpacity={0.35} />

        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={tick}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={32}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
          tickMargin={4}
        />

        <ChartTooltip
          cursor={{ strokeOpacity: 0.4 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) => full(Number(payload?.[0]?.payload?.t))}
            />
          }
        />

        <Area
          dataKey="cigarettes"
          type="monotone"
          stroke="var(--color-cigarettes)"
          strokeWidth={2}
          fill="url(#journeyFill)"
          isAnimationActive={false}
        />

        {quitAt !== null && (
          <ReferenceDot
            x={quitAt}
            y={0}
            r={4}
            fill="var(--color-cigarettes)"
            stroke="var(--background)"
            strokeWidth={2}
            isFront
            label={{
              value: "First smoke-free day",
              position: "top",
              offset: 14,
              className: "fill-muted-foreground text-[11px]",
            }}
          />
        )}
      </AreaChart>
    </ChartContainer>
  )
}
