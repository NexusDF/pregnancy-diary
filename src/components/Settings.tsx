import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseBackup } from "@/lib/backup"
import {
  dueFromLmp,
  formatDate,
  isISODate,
  lmpFromSettings,
  toISODate,
  weekOn,
} from "@/lib/week"
import type { Backup, DateAnchor, Settings } from "@/types"

type SettingsPanelProps = {
  settings: Settings | null
  onSave: (settings: Settings) => void
  onExport: () => void
  onImport: (backup: Backup) => void
}

export function SettingsPanel({ settings, onSave, onExport, onImport }: SettingsPanelProps) {
  return (
    <SettingsForm
      key={`${settings?.anchor ?? "none"}-${settings?.date ?? ""}`}
      settings={settings}
      onSave={onSave}
      onExport={onExport}
      onImport={onImport}
    />
  )
}

function SettingsForm({ settings, onSave, onExport, onImport }: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [anchor, setAnchor] = useState<DateAnchor>(settings?.anchor ?? "lmp")
  const [date, setDate] = useState(settings?.date ?? "")
  const [pending, setPending] = useState<Backup | null>(null)

  const preview = isISODate(date)
    ? describe(anchor, date)
    : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isISODate(date)) return
    onSave({ anchor, date })
  }

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setPending(parseBackup(String(reader.result ?? "")))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось прочитать файл")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Срок</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Button
                type="button"
                variant={anchor === "lmp" ? "default" : "outline"}
                className="h-auto px-3 py-3 text-base whitespace-normal"
                onClick={() => setAnchor("lmp")}
              >
                Первый день последних месячных
              </Button>
              <Button
                type="button"
                variant={anchor === "due" ? "default" : "outline"}
                className="h-12 text-base"
                onClick={() => setAnchor("due")}
              >
                Предполагаемая дата родов
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settings-date" className="text-base">
                {anchor === "lmp" ? "Дата начала" : "Дата родов"}
              </Label>
              <Input
                id="settings-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            {preview ? <p className="text-base text-muted-foreground">{preview}</p> : null}
            <p className="text-sm text-muted-foreground">
              Неделя считается от первого дня последних месячных. Предполагаемая дата родов — это
              начало плюс 280 дней.
            </p>
            <Button type="submit" className="h-12 text-base" disabled={!isISODate(date)}>
              Сохранить
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Резервная копия</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-base text-muted-foreground">
            Файл JSON хранит настройки и записи. Он пригодится, если очистить данные браузера.
          </p>
          <Button type="button" variant="outline" className="h-12 text-base" onClick={onExport}>
            Экспорт в JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base"
            onClick={() => fileRef.current?.click()}
          >
            Импорт из JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) readFile(file)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Заменить данные?</DialogTitle>
            <DialogDescription className="text-base">
              В файле {pending?.entries.length ?? 0} записей. Текущие настройки и записи будут
              заменены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="h-12 text-base" onClick={() => setPending(null)}>
              Отмена
            </Button>
            <Button
              type="button"
              className="h-12 text-base"
              onClick={() => {
                if (!pending) return
                onImport(pending)
                setPending(null)
              }}
            >
              Заменить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function describe(anchor: DateAnchor, date: string): string {
  const draft: Settings = { anchor, date }
  const lmp = lmpFromSettings(draft)
  const due = dueFromLmp(lmp)
  const week = weekOn(lmp, toISODate(new Date()))
  const dates =
    anchor === "lmp"
      ? `ПДР: ${formatDate(toISODate(due))}`
      : `Начало: ${formatDate(toISODate(lmp))}`
  const now = week < 1 ? "По этой дате срок ещё не начался" : `Сейчас ${week}-я неделя`
  return `${dates}. ${now}.`
}
