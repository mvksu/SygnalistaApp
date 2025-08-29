"use client"

import * as React from "react"
import Link from "next/link"
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ColumnsIcon,
  GripVerticalIcon,
  MoreVerticalIcon,
  UserPlus
} from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { DatePickerWithRange } from "../cases/data-picker-with-range"
import { useUser } from "@clerk/nextjs"
import { DateRange } from "react-day-picker"

export const schema = z.object({
  id: z.string(),
  caseId: z.string(),
  subject: z.string().nullable().optional(),
  category: z.string(),
  assignees: z
    .array(
      z.object({ id: z.string().optional(), name: z.string().optional() })
    )
    .default([]),
  status: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  acknowledgedAt: z.union([z.string(), z.date()]).nullable(),
  feedbackDueAt: z.union([z.string(), z.date()]).nullable(),
  ackDueAt: z.union([z.string(), z.date()]),
  ackStatus: z.enum(["due", "overdue", "done"]),
  feedbackStatus: z.enum(["due", "overdue", "done"])
})

export type DataTableRow = z.infer<typeof schema>

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <GripVerticalIcon className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function formatDate(value: unknown): string {
  if (!value) return "—"
  try {
    const d = value instanceof Date ? value : new Date(String(value))
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
  } catch {
    return "—"
  }
}

function chip(state: "due" | "overdue" | "done", dueAt?: unknown) {
  const map = {
    due: "bg-amber-100 text-amber-900",
    overdue: "bg-red-100 text-red-900",
    done: "bg-emerald-100 text-emerald-900"
  } as const
  let remain = ""
  if (dueAt && state !== "done") {
    const d = dueAt instanceof Date ? dueAt : new Date(String(dueAt))
    if (!isNaN(d.getTime())) {
      const ms = d.getTime() - Date.now()
      const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
      remain = days >= 0 ? `${days}d` : `${Math.abs(days)}d late`
    }
  }
  return (
    <span className={`px-2 py-1 rounded text-xs ${map[state]}`}>
      {state}
      {remain ? ` • ${remain}` : ""}
    </span>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "caseId",
    header: "Case ID",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/cases/${row.original.id}`}
        className="text-primary font-mono hover:underline"
      >
        {row.original.caseId}
      </Link>
    ),
    enableHiding: false
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status}
        </Badge>
      </div>
    )
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <div
        className="max-w-[240px] truncate"
        title={row.original.subject || "—"}
      >
        {row.original.subject || "—"}
      </div>
    )
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category
  },
  {
    id: "assignees",
    header: "Assignees",
    cell: ({ row }) => {
      return (
        <>
          {row.original.assignees.length > 0 ? (
            row.original.assignees.map(a => (
              <Avatar
                key={a.id}
                className="mr-1 inline-flex h-4 w-4 bg-blue-100 text-xs"
              >
                {a.name
                  ? a.name.charAt(0) + a.name.charAt(a.name.length - 1)
                  : "?"}
              </Avatar>
            ))
          ) : (
            <AssignPopover reportId={row.original.id} />
          )}
        </>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt)
  },
  {
    id: "lastUpdate",
    header: "Last update",
    cell: () => "—"
  },
  {
    id: "ackChip",
    header: "Ack",
    cell: ({ row }) => chip(row.original.ackStatus, row.original.ackDueAt)
  },
  {
    id: "feedbackChip",
    header: "Feedback",
    cell: ({ row }) =>
      chip(row.original.feedbackStatus, row.original.feedbackDueAt)
  }, // No reviewer field in CaseRow; showing Status instead below
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
            size="icon"
          >
            <MoreVerticalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition
      }}
    >
      {row.getVisibleCells().map(cell => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData
}: {
  data: z.infer<typeof schema>[]
}) {
  const { user } = useUser()
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10
  })
  const [view, setView] = React.useState<"all" | "assigned" | "unassigned">(
    "all"
  )
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const filteredData = React.useMemo(() => {
    return data
      .filter(row => {
        if (view === "unassigned") return row.assignees.length === 0
        if (view === "assigned") {
          const uid = user?.id
          return uid ? row.assignees.some(a => a.id === uid) : false
        }
        return true
      })
      .filter(row => {
        if (!dateRange?.from && !dateRange?.to) return true
        const created = new Date(row.createdAt as Date | string)
        if (dateRange?.from && created < dateRange.from) return false
        if (dateRange?.to) {
          const end = new Date(dateRange.to)
          end.setHours(23, 59, 59, 999)
          if (created > end) return false
        }
        return true
      })
  }, [data, view, dateRange, user?.id])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData.map(({ id }) => id),
    [filteredData]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination
    },
    getRowId: row => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData(prev => {
        const oldIndex = prev.findIndex(r => r.id === active.id)
        const newIndex = prev.findIndex(r => r.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      value={view}
      onValueChange={val => setView(val as "all" | "assigned" | "unassigned")}
      className="flex w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          value={view}
          onValueChange={val =>
            setView(val as "all" | "assigned" | "unassigned")
          }
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="assigned">Assigned to me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to me</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  column =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map(column => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={value =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <DatePickerWithRange value={dateRange} onChange={v => setDateRange(v)} />
          <Button
            onClick={() => {
              const rows = table.getFilteredSelectedRowModel().rows
              if (!rows.length) return
              const escape = (val: unknown) => {
                if (val === null || val === undefined) return ""
                const s = String(val)
                if (s.includes("\"") || s.includes(",") || s.includes("\n")) {
                  return `"${s.replaceAll('"', '""')}"`
                }
                return s
              }
              const toIso = (d: unknown) => {
                if (!d) return ""
                try {
                  const dt = d instanceof Date ? d : new Date(String(d))
                  return isNaN(dt.getTime()) ? "" : dt.toISOString()
                } catch {
                  return ""
                }
              }
              const header = [
                "case_id",
                "subject",
                "category",
                "status",
                "created",
                "acknowledged",
                "ack_due",
                "feedback_due",
                "ack_status",
                "feedback_status",
                "assignees"
              ]
              const csvLines = [header.join(",")]
              for (const r of rows) {
                const o = r.original
                const assignees = Array.isArray(o.assignees)
                  ? o.assignees.map(a => a.name || "").filter(Boolean).join("; ")
                  : ""
                csvLines.push(
                  [
                    escape(o.caseId),
                    escape(o.subject || ""),
                    escape(o.category),
                    escape(o.status),
                    escape(toIso(o.createdAt)),
                    escape(toIso(o.acknowledgedAt)),
                    escape(toIso(o.ackDueAt)),
                    escape(toIso(o.feedbackDueAt)),
                    escape(o.ackStatus),
                    escape(o.feedbackStatus),
                    escape(assignees)
                  ].join(",")
                )
              }
              const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              const ts = new Date()
                .toISOString()
                .replaceAll(":", "-")
                .slice(0, 19)
              a.href = url
              a.download = `cases-${ts}.csv`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }}
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
          >
            Export cases
          </Button>
        </div>
      </div>
      <TabsContent
        value={view}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map(row => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={value => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

function AssignPopover({ reportId }: { reportId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [members, setMembers] = useState<
    Array<{ orgMemberId: string; name: string; email: string }>
  >([])
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    const fetchMembers = async () => {
      const res = await fetch("/api/members")
      const data = await res.json()
      setMembers(data || [])
    }
    fetchMembers()
  }, [open])

  const filtered = members.filter(m => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    )
  })

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const confirm = async () => {
    if (selected.length === 0) return setOpen(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/assignees`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ add: selected })
      })
      if (!res.ok) throw new Error("Failed to assign")
      // simple refresh
      window.location.reload()
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="h-7 w-7 rounded-full p-0"
          aria-label="Assign"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[380px] p-4">
        <SheetHeader>
          <SheetTitle>Assign handlers</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Search name or email"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="max-h-[50vh] overflow-auto rounded border">
            {filtered.map(m => (
              <label
                key={m.orgMemberId}
                className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(m.orgMemberId)}
                  onChange={() => toggle(m.orgMemberId)}
                />
                <div>
                  <div className="text-sm font-medium">{m.name || m.email}</div>
                  <div className="text-muted-foreground text-xs">{m.email}</div>
                </div>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="text-muted-foreground p-3 text-sm">
                No matches
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="w-full"
              disabled={loading || selected.length === 0}
              onClick={confirm}
            >
              Confirm
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Removed details Sheet and chart mock to align with CaseRow data

