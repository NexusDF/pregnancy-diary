import { createId } from "@/lib/storage"
import { isISODate } from "@/lib/week"
import type { Backup, Entry, Settings } from "@/types"

export function toBackup(settings: Settings | null, entries: Entry[]): Backup {
  return { version: 1, settings, entries }
}

export function downloadBackup(backup: Backup, filename: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("Файл не похож на JSON")
  }

  if (!data || typeof data !== "object") {
    throw new Error("Неверная структура файла")
  }

  const record = data as Record<string, unknown>
  if (record.version !== 1) {
    throw new Error("Неподдерживаемая версия копии")
  }

  if (!Array.isArray(record.entries)) {
    throw new Error("В файле нет списка записей")
  }

  return {
    version: 1,
    settings: parseSettings(record.settings),
    entries: record.entries.map(parseEntry),
  }
}

function parseSettings(value: unknown): Settings | null {
  if (value == null) return null
  if (!value || typeof value !== "object") {
    throw new Error("Настройки в файле повреждены")
  }
  const record = value as Record<string, unknown>
  if (record.anchor !== "lmp" && record.anchor !== "due") {
    throw new Error("В настройках не указан тип даты")
  }
  if (typeof record.date !== "string" || !isISODate(record.date)) {
    throw new Error("Дата в настройках указана неверно")
  }
  return { anchor: record.anchor, date: record.date }
}

function parseEntry(value: unknown): Entry {
  if (!value || typeof value !== "object") {
    throw new Error("В файле есть повреждённая запись")
  }
  const record = value as Record<string, unknown>
  if (typeof record.date !== "string" || !isISODate(record.date)) {
    throw new Error("В одной из записей неверная дата")
  }

  const week = asNumber(record.week)
  const weight = asNumber(record.weight)
  const waist = asNumber(record.waist)
  if (
    week === null ||
    !Number.isInteger(week) ||
    week < 0 ||
    week > 60 ||
    weight === null ||
    weight <= 0 ||
    waist === null ||
    waist <= 0
  ) {
    throw new Error("В одной из записей неверные числа")
  }

  return {
    id: typeof record.id === "string" && record.id ? record.id : createId(),
    date: record.date,
    week,
    weight,
    waist,
    note: typeof record.note === "string" ? record.note : "",
  }
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return null
}
