'use client';

import { useCallback, useEffect, useState } from "react";
import type { CalendarApi } from "@fullcalendar/core";

import { CalendarBoard, type CalendarEvent } from "@/components/planner/calendar-board";

import { PlannerHeader, type PlannerView } from "./planner-header";

type PlannerClientProps = {
  events: CalendarEvent[];
};

type FullCalendarView = "timeGridDay" | "timeGridWeek" | "dayGridMonth" | "listYear";

const plannerViewToCalendar: Record<PlannerView, FullCalendarView> = {
  Day: "timeGridDay",
  Week: "timeGridWeek",
  Month: "dayGridMonth",
  Year: "listYear",
};

export function PlannerClient({ events }: PlannerClientProps) {
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const [activeView, setActiveView] = useState<PlannerView>("Week");

  const handlePrev = useCallback(() => {
    calendarApi?.prev();
  }, [calendarApi]);

  const handleNext = useCallback(() => {
    calendarApi?.next();
  }, [calendarApi]);

  const handleToday = useCallback(() => {
    calendarApi?.today();
  }, [calendarApi]);

  const handleViewChange = useCallback((view: PlannerView) => {
    setActiveView(view);
  }, []);

  useEffect(() => {
    if (!calendarApi) return;
    calendarApi.changeView(plannerViewToCalendar[activeView]);
  }, [calendarApi, activeView]);

  return (
    <section className="space-y-4 rounded-[32px] border bg-white p-4 shadow-sm sm:p-6">
      <PlannerHeader
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        activeView={activeView}
        onViewChange={handleViewChange}
      />
      <CalendarBoard events={events} onCalendarReady={setCalendarApi} />
    </section>
  );
}

