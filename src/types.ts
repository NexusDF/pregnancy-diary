export type DateAnchor = "lmp" | "due"

export type Settings = {
  anchor: DateAnchor
  date: string
}

export type Entry = {
  id: string
  date: string
  week: number
  weight: number
  waist: number
  note: string
}

export type Period = "weeks" | "4w" | "3m" | "all"

export type Backup = {
  version: 1
  settings: Settings | null
  entries: Entry[]
}

export type EntryDraft = {
  date: string
  week: string
  weight: string
  waist: string
  note: string
}
