import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatNumber } from "@/lib/week"
import type { Entry } from "@/types"

type EntryListProps = {
  entries: Entry[]
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}

export function EntryList({ entries, onEdit, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-base text-muted-foreground">
          Пока нет записей. Нажмите «+», чтобы добавить первую.
        </CardContent>
      </Card>
    )
  }

  const sorted = [...entries].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  )

  return (
    <Card className="py-0">
      <Table className="text-base">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Дата</TableHead>
            <TableHead>Вес</TableHead>
            <TableHead>Талия</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">Действия</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="pl-6 whitespace-normal">
                <div className="font-medium">{formatDate(entry.date)}</div>
                <div className="text-sm text-muted-foreground">{entry.week}-я нед.</div>
                {entry.note ? (
                  <div className="mt-1 text-sm text-muted-foreground">{entry.note}</div>
                ) : null}
              </TableCell>
              <TableCell>{formatNumber(entry.weight, 1)}</TableCell>
              <TableCell>{formatNumber(entry.waist, 1)}</TableCell>
              <TableCell className="px-1">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={`Изменить запись от ${formatDate(entry.date)}`}
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 text-destructive"
                    aria-label={`Удалить запись от ${formatDate(entry.date)}`}
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
