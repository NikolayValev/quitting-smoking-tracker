"use client"

import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type JourneyPoint = {
  /** Epoch ms. The x axis is real time, not check-in order. */
  t: number
  /** Absent on a day that said nothing about cigarettes. */
  cigarettes?: number
  /** Times cannabis was used; absent likewise. */
  sessions?: number
}

/** Keyed by the check-in field each series reads. */
const config = {
  cigarettes: { label: "Cigarettes", color: "var(--primary)" },
  // Orange against the green: two greens or blues read as one line.
  sessions: { label: "Cannabis", color: "var(--chart-1)" },
} satisfies ChartConfig

export type JourneySeries = keyof typeof config

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
 * One series for one substance, so no legend; the heading names it. Someone
 * quitting both gets two, named in the heading too. The only direct label is the
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
  series = ["cigarettes"],
  quitLabel = "First smoke-free day",
}: {
  data: JourneyPoint[]
  quitAt: number | null
  /** Which counts to draw. Two when someone is quitting both, each its own
   *  area, so one coming down is not hidden by the other. */
  series?: JourneySeries[]
  /** The label on the first day of the current streak. */
  quitLabel?: string
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: -20 }}>
        <defs>
          {series.map((key) => (
            <linearGradient key={key} id={`journeyFill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${key})`} stopOpacity={0.28} />
              <stop offset="100%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
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

        {/* Two areas need telling apart; one does not. */}
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}

        {series.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            fill={`url(#journeyFill-${key})`}
            // A day that did not record this substance is a gap in its
            // line, not a zero.
            connectNulls
            isAnimationActive={false}
          />
        ))}

        {quitAt !== null && (
          <ReferenceDot
            x={quitAt}
            y={0}
            r={4}
            fill={`var(--color-${series[0]})`}
            stroke="var(--background)"
            strokeWidth={2}
            isFront
            label={{
              value: quitLabel,
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
