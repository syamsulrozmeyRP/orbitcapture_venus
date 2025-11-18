'use client';

import { useEffect, useRef, useTransition } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { CalendarApi } from "@fullcalendar/core";

import { rescheduleContentItemAction } from "@/actions/content-items";

export type CalendarEvent = {
  id: string;
  title: string;
  status: string;
  channel?: string | null;
  personaName?: string | null;
  scheduledAt?: string | null;
};

type Props = {
  events: CalendarEvent[];
  onCalendarReady?: (api: CalendarApi) => void;
};

const statusAccentColors: Record<string, string> = {
  IDEA: "bg-indigo-500",
  BRIEFING: "bg-sky-500",
  READY: "bg-emerald-500",
  IN_REVIEW: "bg-amber-500",
  APPROVED: "bg-green-500",
  SCHEDULED: "bg-purple-500",
  PUBLISHED: "bg-zinc-500",
};

export function CalendarBoard({ events, onCalendarReady }: Props) {
  const [isPending, startTransition] = useTransition();
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    if (!onCalendarReady) return;
    const id = requestAnimationFrame(() => {
      if (calendarRef.current) {
        onCalendarReady(calendarRef.current.getApi());
      }
    });
    return () => cancelAnimationFrame(id);
  }, [onCalendarReady]);

  const formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.scheduledAt ?? undefined,
    extendedProps: event,
  }));

  return (
    <div className="planner-calendar overflow-hidden">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        height="100%"
        contentHeight="auto"
        expandRows
        slotMinTime="07:00:00"
        slotMaxTime="17:30:00"
        slotDuration="01:00:00"
        allDaySlot={false}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        slotLabelFormat={{ hour: "numeric", meridiem: "short" }}
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
            <div className="relative rounded-xl border border-zinc-800 bg-black/90 p-2 text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
              <span
                className={`absolute inset-y-1 left-1 w-1 rounded-full ${statusAccentColors[status] ?? "bg-sky-500"}`}
              />
              <div className="ml-2 space-y-1">
                <span className="inline-flex items-center rounded-full border border-white/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {channel ?? "Multi"}
                </span>
                <p className="text-xs font-semibold leading-tight">{arg.event.title}</p>
                <p className="text-[10px] text-zinc-300">{personaName ?? "Persona focus"}</p>
              </div>
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

      <style jsx global>{`
        .planner-calendar .fc {
          font-family: var(--font-geist-sans, "Inter"), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .planner-calendar .fc-scrollgrid,
        .planner-calendar .fc-scrollgrid table {
          border: none !important;
        }
        .planner-calendar .fc-timegrid-slot,
        .planner-calendar .fc-col-header-cell,
        .planner-calendar .fc-daygrid-day,
        .planner-calendar .fc-timegrid-axis {
          border-color: #e4e4e7 !important;
        }
        .planner-calendar .fc-timegrid-axis {
          color: #71717a;
          font-size: 0.68rem;
          font-weight: 500;
        }
        .planner-calendar .fc-timegrid-slot-label-cushion {
          font-size: 0.68rem;
        }
        .planner-calendar .fc-col-header-cell {
          background: transparent;
          text-transform: uppercase;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          color: #71717a;
        }
        .planner-calendar .fc-col-header-cell-cushion {
          padding: 0.75rem 0;
        }
        .planner-calendar .fc-timegrid-slot {
          height: 64px;
        }
        .planner-calendar .fc-timegrid-slot-lane {
          background-color: #ffffff;
        }
        .planner-calendar .fc-timegrid-col.fc-day-sun,
        .planner-calendar .fc-timegrid-col.fc-day-sat,
        .planner-calendar .fc-col-header-cell.fc-day-sun,
        .planner-calendar .fc-col-header-cell.fc-day-sat {
          background-color: #fafafa;
        }
        .planner-calendar .fc-timegrid-axis-cushion {
          padding: 0.5rem;
        }
        .planner-calendar .fc-timegrid .fc-daygrid-body {
          display: none;
        }
        .planner-calendar .fc-theme-standard td,
        .planner-calendar .fc-theme-standard th {
          border-color: #e4e4e7;
        }
      `}</style>
    </div>
  );
}
