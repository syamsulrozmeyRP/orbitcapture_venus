'use client';

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PlannerView = "Day" | "Week" | "Month" | "Year";

type PlannerHeaderProps = {
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onViewChange?: (view: PlannerView) => void;
  activeView?: PlannerView;
  className?: string;
};

const viewOptions: PlannerView[] = ["Day", "Week", "Month", "Year"];

function ViewToggle({
  className,
  activeView = "Week",
  onSelect,
}: {
  className?: string;
  activeView?: PlannerView;
  onSelect?: (view: PlannerView) => void;
}) {
  return (
    <div className={cn("flex items-center gap-1 rounded-full bg-zinc-100 p-1 text-sm font-medium text-zinc-500", className)}>
      {viewOptions.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === activeView}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            option === activeView ? "bg-black text-white" : "text-zinc-500",
          )}
          onClick={() => onSelect?.(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function PlannerHeader({ onPrev, onNext, onToday, onViewChange, activeView = "Week", className }: PlannerHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="flex flex-1 items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-900">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-none border-r border-zinc-200 bg-transparent hover:bg-zinc-200"
            onClick={onPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-none bg-transparent px-6 font-medium hover:bg-zinc-200"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-none border-l border-zinc-200 bg-transparent hover:bg-zinc-200"
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <ViewToggle className="hidden md:flex" activeView={activeView} onSelect={onViewChange} />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="md:hidden">
          <ViewToggle activeView={activeView} onSelect={onViewChange} />
        </div>
        <div className="relative w-full max-w-xs rounded-xl border border-zinc-200 bg-zinc-100">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="search"
            placeholder="Search"
            className="h-10 border-0 bg-transparent pl-9 text-sm text-zinc-600 placeholder:text-zinc-500"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

