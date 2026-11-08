import type { Settings } from "@/types"

const PREGNANCY_DAYS = 280

export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function isISODate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  if (!year || !month || !day) return iso
  return `${day}.${month}.${year}`
}

export function formatShortDate(iso: string): string {
  const parts = iso.split("-")
  return `${parts[2] ?? ""}.${parts[1] ?? ""}`
}

export function formatNumber(value: number, digits: number): string {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

export function lmpFromSettings(settings: Settings): Date {
  const date = parseISODate(settings.date)
  if (settings.anchor === "due") {
    const lmp = new Date(date)
    lmp.setDate(lmp.getDate() - PREGNANCY_DAYS)
    return lmp
  }
  return date
}

export function dueFromLmp(lmp: Date): Date {
  const due = new Date(lmp.getFullYear(), lmp.getMonth(), lmp.getDate())
  due.setDate(due.getDate() + PREGNANCY_DAYS)
  return due
}

export function weekOn(lmp: Date, iso: string): number {
  const on = parseISODate(iso)
  const start = new Date(lmp.getFullYear(), lmp.getMonth(), lmp.getDate())
  const days = Math.round((on.getTime() - start.getTime()) / 86_400_000)
  return Math.floor(days / 7) + 1
}

export function shiftISODate(iso: string, days: number, months: number): string {
  const date = parseISODate(iso)
  if (months) date.setMonth(date.getMonth() + months)
  if (days) date.setDate(date.getDate() + days)
  return toISODate(date)
}
