import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isISODate, weekOn } from "@/lib/week"
import type { EntryDraft } from "@/types"

type EntryFormProps = {
  initial: EntryDraft
  lmp: Date | null
  submitLabel: string
  onSubmit: (draft: EntryDraft) => void
}

export function EntryForm({ initial, lmp, submitLabel, onSubmit }: EntryFormProps) {
  const [date, setDate] = useState(initial.date)
  const [week, setWeek] = useState(initial.week)
  const [weight, setWeight] = useState(initial.weight)
  const [waist, setWaist] = useState(initial.waist)
  const [note, setNote] = useState(initial.note)
  const [error, setError] = useState<string | null>(null)

  function handleDate(value: string) {
    setDate(value)
    if (lmp && isISODate(value)) setWeek(String(weekOn(lmp, value)))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isISODate(date)) {
      setError("Укажите дату")
      return
    }
    const weekNumber = Number(week)
    if (!Number.isInteger(weekNumber) || weekNumber < 0 || weekNumber > 60) {
      setError("Неделя — целое число от 0 до 60")
      return
    }
    const weightNumber = parsePositive(weight)
    const waistNumber = parsePositive(waist)
    if (weightNumber === null) {
      setError("Укажите вес больше нуля")
      return
    }
    if (waistNumber === null) {
      setError("Укажите обхват талии больше нуля")
      return
    }
    if (note.trim().length > 500) {
      setError("Заметка длиннее 500 символов")
      return
    }
    setError(null)
    onSubmit({
      date,
      week: String(weekNumber),
      weight: String(weightNumber),
      waist: String(waistNumber),
      note: note.trim(),
    })
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="entry-date" className="text-base">
          Дата
        </Label>
        <Input
          id="entry-date"
          type="date"
          value={date}
          onChange={(event) => handleDate(event.target.value)}
          className="h-12 text-base"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entry-week" className="text-base">
          Неделя беременности
        </Label>
        <Input
          id="entry-week"
          inputMode="numeric"
          value={week}
          onChange={(event) => setWeek(event.target.value)}
          className="h-12 text-base"
          required
        />
        <p className="text-sm text-muted-foreground">
          Считается по дате и обновляется, если дату поменять. Число можно исправить вручную.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="entry-weight" className="text-base">
            Вес, кг
          </Label>
          <Input
            id="entry-weight"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="62,5"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            className="h-12 text-base"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="entry-waist" className="text-base">
            Талия, см
          </Label>
          <Input
            id="entry-waist"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            placeholder="80"
            value={waist}
            onChange={(event) => setWaist(event.target.value)}
            className="h-12 text-base"
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entry-note" className="text-base">
          Заметка
        </Label>
        <Input
          id="entry-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Необязательно"
          className="h-12 text-base"
        />
      </div>
      {error ? (
        <p className="text-base text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-12 text-base">
        {submitLabel}
      </Button>
    </form>
  )
}

function parsePositive(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".")
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}
