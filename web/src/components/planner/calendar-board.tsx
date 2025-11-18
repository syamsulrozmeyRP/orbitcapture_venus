'use client'

import { useTransition } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import { rescheduleContentItemAction } from "@/actions/content-items";

type CalendarEvent = {
  id: string;
  title: string;
  status: string;
  channel?: string | null;
  personaName?: string | null;
  scheduledAt?: string | null;
};

type Props = {
  events: CalendarEvent[];
};

const statusColors: Record<string, string> = {
  IDEA: "bg-indigo-100 text-indigo-700 border-indigo-200",
  BRIEFING: "bg-sky-100 text-sky-700 border-sky-200",
  READY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  IN_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  SCHEDULED: "bg-purple-100 text-purple-700 border-purple-200",
  PUBLISHED: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function CalendarBoard({ events }: Props) {
  const [isPending, startTransition] = useTransition();

  const formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.scheduledAt ?? undefined,
    extendedProps: event,
  }));

  return (
    <div className="rounded-2xl border bg-card p-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        height="auto"
        editable
        droppable
        selectable
        events={formattedEvents}
        eventDrop={(arg) => {
          const newDate = arg.event.start;
          if (!newDate) return;
          startTransition(() =>
            rescheduleContentItemAction({
              contentItemId: arg.event.id,
              scheduledAt: newDate.toISOString(),
            }),
          );
        }}
        eventContent={(arg) => {
          const { status, channel, personaName } = arg.event.extendedProps as CalendarEvent;

          return (
            <div
              className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusColors[status] ?? "bg-slate-100 text-slate-800"}`}
            >
              <p className="truncate">{arg.event.title}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {channel ?? "Multi"} · {personaName ?? "Persona"}
              </p>
            </div>
          );
        }}
        eventOverlap
        loading={(isLoading) => {
          if (isLoading) {
            document.body.classList.add("cursor-wait");
          } else {
            document.body.classList.remove("cursor-wait");
          }
        }}
      />
      {isPending && <p className="px-3 py-2 text-xs text-muted-foreground">Updating schedule…</p>}
    </div>
  );
}
