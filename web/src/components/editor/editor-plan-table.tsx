'use client';

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import type { ContentStatus } from "@prisma/client";

import { updateContentStatusAction } from "@/actions/content-items";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateContentDialog } from "@/components/planner/create-content-dialog";

type PersonaOption = {
  id: string;
  name: string;
  jobTitle?: string | null;
  industry?: string | null;
  pains?: string | null;
  goals?: string | null;
  voice?: string | null;
};

export type ContentPlanRow = {
  id: string;
  title: string;
  status: ContentStatus;
  channel?: string | null;
  personaName?: string | null;
  writerName?: string | null;
  scheduledAt?: string | null;
  updatedAt: string;
};

type EditorPlanTableProps = {
  rows: ContentPlanRow[];
  personas: PersonaOption[];
};

const statusOptions: { label: string; value: ContentStatus }[] = [
  { label: "Idea", value: "IDEA" },
  { label: "Briefing", value: "BRIEFING" },
  { label: "Ready", value: "READY" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Approved", value: "APPROVED" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Published", value: "PUBLISHED" },
];

const statusPills: Record<ContentStatus, { label: string; tone: string }> = {
  IDEA: { label: "Idea", tone: "bg-muted text-muted-foreground" },
  BRIEFING: { label: "Briefing", tone: "bg-amber-100 text-amber-900" },
  READY: { label: "Ready", tone: "bg-emerald-100 text-emerald-900" },
  IN_REVIEW: { label: "In review", tone: "bg-blue-100 text-blue-900" },
  APPROVED: { label: "Approved", tone: "bg-green-200 text-green-900" },
  SCHEDULED: { label: "Scheduled", tone: "bg-purple-100 text-purple-900" },
  PUBLISHED: { label: "Published", tone: "bg-slate-900 text-white" },
};

export function EditorPlanTable({ rows, personas }: EditorPlanTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [localRows, setLocalRows] = useState(rows);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    return localRows.filter((row) => {
      const matchesSearch =
        row.title.toLowerCase().includes(search.toLowerCase()) ||
        (row.channel ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localRows, search, statusFilter]);

  const handleStatusChange = (planId: string, status: ContentStatus) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("contentItemId", planId);
      formData.set("status", status);
      const result = await updateContentStatusAction(initialActionState, formData);
      if (result.status === "error") {
        setError(result.message ?? "Unable to update status.");
        return;
      }

      setLocalRows((prev) => prev.map((row) => (row.id === planId ? { ...row, status } : row)));
      setError(null);
    });
  };

  return (
    <div className="space-y-4 rounded-3xl border bg-card/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Filter tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full max-w-sm rounded-2xl border-2"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm">
            <span>Status</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value === "all" ? "all" : (value as ContentStatus))}
            >
              <SelectTrigger className="h-8 w-[140px] rounded-xl bg-background">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-2xl" size="sm">
            Priority
          </Button>
          <Button variant="outline" className="rounded-2xl" size="sm">
            View
          </Button>
          <CreateContentDialog personas={personas} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs uppercase tracking-wide">
              <TableHead className="w-12">
                <input type="checkbox" aria-label="Select all" />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Writer</TableHead>
              <TableHead>Persona</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No content items match your filters.
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="text-sm">
                <TableCell>
                  <input type="checkbox" aria-label={`Select ${row.title}`} />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/app/editor/${row.id}`} className="hover:underline">
                    {row.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Badge className={`w-fit rounded-full px-3 py-1 text-xs ${statusPills[row.status].tone}`}>
                      {statusPills[row.status].label}
                    </Badge>
                    <Select
                      value={row.status}
                      onValueChange={(value) => handleStatusChange(row.id, value as ContentStatus)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-8 w-[150px] rounded-xl bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell>{row.writerName ?? "AI Orbi"}</TableCell>
                <TableCell>{row.personaName ?? "—"}</TableCell>
                <TableCell>
                  {row.channel ? (
                    <Badge variant="outline" className="rounded-full">
                      {row.channel}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {row.scheduledAt ? format(new Date(row.scheduledAt), "MMM d, HH:mm") : "Unscheduled"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select defaultValue="10">
            <SelectTrigger className="h-8 w-[80px] rounded-xl bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            «
          </Button>
          <Button variant="ghost" size="icon">
            ‹
          </Button>
          <span className="px-2">Page 1 of 4</span>
          <Button variant="ghost" size="icon">
            ›
          </Button>
          <Button variant="ghost" size="icon">
            »
          </Button>
        </div>
      </div>
    </div>
  );
}

