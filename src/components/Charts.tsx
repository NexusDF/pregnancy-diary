import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatDate, formatNumber, formatShortDate, shiftISODate, todayISO } from "@/lib/week"
import type { Entry, Period } from "@/types"

const PERIODS: { id: Period; label: string }[] = [
  { id: "weeks", label: "По неделям беременности" },
  { id: "4w", label: "Последние 4 недели" },
  { id: "3m", label: "Последние 3 месяца" },
  { id: "all", label: "Всё время" },
]

const weightConfig = {
  weight: { label: "Вес, кг", color: "var(--chart-1)" },
} satisfies ChartConfig

const waistConfig = {
  waist: { label: "Талия, см", color: "var(--chart-2)" },
} satisfies ChartConfig

type ChartRow = {
  label: string
  weight: number
  waist: number
  fullDate: string
  week: number
}

export function Charts({ entries }: { entries: Entry[] }) {
  const [period, setPeriod] = useState<Period>("weeks")
  const filtered = useMemo(() => filterEntries(entries, period), [entries, period])
  const rows = useMemo(() => toRows(filtered, period), [filtered, period])

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2">
        {PERIODS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={period === item.id ? "default" : "outline"}
            className="h-auto px-3 py-2 text-sm whitespace-normal"
            onClick={() => setPeriod(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <MetricChart
        title="Вес"
        data={rows}
        dataKey="weight"
        config={weightConfig}
        delta={formatDelta(filtered, "weight", 1, "кг")}
      />
      <MetricChart
        title="Обхват талии"
        data={rows}
        dataKey="waist"
        config={waistConfig}
        delta={formatDelta(filtered, "waist", 1, "см")}
      />
    </div>
  )
}

function MetricChart({
  title,
  data,
  dataKey,
  config,
  delta,
}: {
  title: string
  data: ChartRow[]
  dataKey: "weight" | "waist"
  config: ChartConfig
  delta: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-base font-medium text-primary">{delta}</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-base text-muted-foreground">Нет записей за этот период</p>
        ) : (
          <ChartContainer config={config} className="aspect-[4/3] w-full">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                domain={["auto", "auto"]}
                tickFormatter={(value: number) => formatNumber(Number(value), 1)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const row = payload?.[0]?.payload as ChartRow | undefined
                      if (!row) return ""
                      return `${row.fullDate}, ${row.week}-я неделя`
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={`var(--color-${dataKey})`}
                strokeWidth={2.5}
                dot={{ r: 3, fill: `var(--color-${dataKey})` }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function filterEntries(entries: Entry[], period: Period): Entry[] {
  const sorted = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
  if (period === "all" || period === "weeks") return sorted
  const today = todayISO()
  const from =
    period === "4w" ? shiftISODate(today, -28, 0) : shiftISODate(today, 0, -3)
  return sorted.filter((entry) => entry.date >= from)
}

function toRows(entries: Entry[], period: Period): ChartRow[] {
  const source =
    period === "weeks"
      ? [...entries].sort((a, b) => a.week - b.week || a.date.localeCompare(b.date))
      : entries
  return source.map((entry) => ({
    label: period === "weeks" ? String(entry.week) : formatShortDate(entry.date),
    weight: entry.weight,
    waist: entry.waist,
    fullDate: formatDate(entry.date),
    week: entry.week,
  }))
}

function formatDelta(
  entries: Entry[],
  key: "weight" | "waist",
  digits: number,
  unit: string,
): string {
  if (entries.length < 2) return "Нужны две записи, чтобы показать разницу"
  const delta = entries[entries.length - 1][key] - entries[0][key]
  const rounded = Number(delta.toFixed(digits))
  if (rounded === 0) return `0 ${unit} за период`
  const sign = rounded > 0 ? "+" : "−"
  return `${sign}${formatNumber(Math.abs(rounded), digits)} ${unit} за период`
}
