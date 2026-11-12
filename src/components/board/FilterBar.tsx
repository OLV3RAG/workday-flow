"use client";

import type { TaskPriority, TaskStatus } from "@/lib/types";
import { COLUMNS, PRIORITIES } from "@/lib/columns";
import type { TaskFilters } from "@/lib/filters";
import { fieldClass } from "@/lib/ui";

type FilterBarProps = {
  filters: TaskFilters;
  shown: number;
  total: number;
  onChange: (filters: TaskFilters) => void;
};

export function FilterBar({ filters, shown, total, onChange }: FilterBarProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-surface/70 p-3 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Buscar</span>
          <input
            className={fieldClass}
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Buscar por título o descripción"
            aria-label="Buscar por título o descripción"
            type="search"
          />
        </label>
        <p className="text-xs text-muted">
          {shown} de {total}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select
          className={fieldClass}
          aria-label="Filtrar por prioridad"
          value={filters.priority}
          onChange={(event) =>
            onChange({ ...filters, priority: event.target.value as TaskPriority | "all" })
          }
        >
          <option value="all">Todas las prioridades</option>
          {PRIORITIES.map((priority) => (
            <option key={priority.id} value={priority.id}>
              Prioridad {priority.label.toLowerCase()}
            </option>
          ))}
        </select>
        <select
          className={fieldClass}
          aria-label="Filtrar por estado"
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as TaskStatus | "all" })
          }
        >
          <option value="all">Todos los estados</option>
          {COLUMNS.map((column) => (
            <option key={column.id} value={column.id}>
              {column.short}
            </option>
          ))}
        </select>
        <button
          type="button"
          role="switch"
          aria-checked={filters.hideDone}
          aria-label="Ocultar terminadas"
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm transition-all duration-200 ${
            filters.hideDone ? "border-accent bg-accent text-primary-ink" : "border-line bg-bg/70"
          }`}
          onClick={() => onChange({ ...filters, hideDone: !filters.hideDone })}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${filters.hideDone ? "bg-primary-ink" : "bg-muted"}`}
          />
          Ocultar terminadas
        </button>
      </div>
    </div>
  );
}
