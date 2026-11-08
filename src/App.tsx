import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Charts } from "@/components/Charts"
import { EasterEgg } from "@/components/EasterEgg"
import { EntryForm } from "@/components/EntryForm"
import { EntryList } from "@/components/EntryList"
import { SettingsPanel } from "@/components/Settings"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { downloadBackup, toBackup } from "@/lib/backup"
import { createId, ENTRIES_KEY, SETTINGS_KEY } from "@/lib/storage"
import { useLocalStorage } from "@/lib/useLocalStorage"
import {
  dueFromLmp,
  formatDate,
  lmpFromSettings,
  todayISO,
  toISODate,
  weekOn,
} from "@/lib/week"
import type { Backup, Entry, EntryDraft, Settings } from "@/types"

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings | null>(SETTINGS_KEY, null)
  const [entries, setEntries] = useLocalStorage<Entry[]>(ENTRIES_KEY, [])
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [deleting, setDeleting] = useState<Entry | null>(null)
  const [eggOpen, setEggOpen] = useState(false)

  const lmp = useMemo(
    () => (settings ? lmpFromSettings(settings) : null),
    [settings],
  )
  const currentWeek = lmp ? weekOn(lmp, todayISO()) : null

  function openCreate() {
    setEditing(null)
    setFormKey((value) => value + 1)
    setFormOpen(true)
  }

  function openEdit(entry: Entry) {
    setEditing(entry)
    setFormKey((value) => value + 1)
    setFormOpen(true)
  }

  function saveEntry(draft: EntryDraft) {
    const entry: Entry = {
      id: editing?.id ?? createId(),
      date: draft.date,
      week: Number(draft.week),
      weight: Number(draft.weight),
      waist: Number(draft.waist),
      note: draft.note,
    }
    setEntries((current) =>
      editing ? current.map((item) => (item.id === entry.id ? entry : item)) : [...current, entry],
    )
    setFormOpen(false)
    setEditing(null)
    toast.success(editing ? "Запись обновлена" : "Запись добавлена")
  }

  function confirmDelete() {
    if (!deleting) return
    setEntries((current) => current.filter((item) => item.id !== deleting.id))
    setDeleting(null)
    toast.success("Запись удалена")
  }

  function exportData() {
    downloadBackup(toBackup(settings, entries), `dnevnik-beremennosti-${todayISO()}.json`)
    toast.success("Файл сохранён")
  }

  function importData(backup: Backup) {
    setSettings(backup.settings)
    setEntries(backup.entries)
    toast.success("Данные импортированы")
  }

  const draft: EntryDraft = editing
    ? {
        date: editing.date,
        week: String(editing.week),
        weight: String(editing.weight),
        waist: String(editing.waist),
        note: editing.note,
      }
    : {
        date: todayISO(),
        week: lmp ? String(weekOn(lmp, todayISO())) : "",
        weight: "",
        waist: "",
        note: "",
      }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-32">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-1 text-2xl font-semibold tracking-tight">
            Дневник беременности
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full text-2xl text-primary"
              onClick={() => setEggOpen(true)}
              aria-label="Сюрприз"
            >
              ♥
            </button>
          </h1>
          <p className="text-base text-muted-foreground">
            {currentWeek === null
              ? "Укажите дату в настройках"
              : currentWeek < 1
                ? "По этой дате беременность ещё не началась"
                : `Сейчас ${currentWeek}-я неделя`}
          </p>
          {lmp ? (
            <p className="text-sm text-muted-foreground">
              ПДР {formatDate(toISODate(dueFromLmp(lmp)))}
            </p>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue={entries.length > 0 ? "charts" : "records"}>
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="records" className="text-sm">
            Записи
          </TabsTrigger>
          <TabsTrigger value="charts" className="text-sm">
            Графики
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-sm">
            Настройки
          </TabsTrigger>
        </TabsList>
        <TabsContent value="records">
          <EntryList entries={entries} onEdit={openEdit} onDelete={setDeleting} />
        </TabsContent>
        <TabsContent value="charts">
          <Charts entries={entries} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPanel
            settings={settings}
            onSave={(next) => {
              setSettings(next)
              toast.success("Настройки сохранены")
            }}
            onExport={exportData}
            onImport={importData}
          />
        </TabsContent>
      </Tabs>

      {formOpen || deleting ? null : (
        <div className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex w-full max-w-lg justify-end px-4">
          <Button
            type="button"
            className="pointer-events-auto size-14 rounded-full text-3xl shadow-lg"
            onClick={openCreate}
            aria-label="Добавить запись"
          >
            +
          </Button>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing ? "Изменить запись" : "Новая запись"}
            </DialogTitle>
            <DialogDescription className="text-base">
              Вес в килограммах, обхват талии в сантиметрах.
            </DialogDescription>
          </DialogHeader>
          <EntryForm
            key={formKey}
            initial={draft}
            lmp={lmp}
            submitLabel={editing ? "Сохранить" : "Добавить"}
            onSubmit={saveEntry}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Удалить запись?</DialogTitle>
            <DialogDescription className="text-base">
              {deleting
                ? `Запись от ${formatDate(deleting.date)} будет удалена. Вернуть её можно только из резервной копии.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-12 text-base"
              onClick={() => setDeleting(null)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12 text-base"
              onClick={confirmDelete}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EasterEgg open={eggOpen} onClose={() => setEggOpen(false)} />
      <Toaster position="top-center" />
    </div>
  )
}
