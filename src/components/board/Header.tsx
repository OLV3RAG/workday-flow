"use client";

import type { SyncPhase } from "@/components/board/useTasks";
import type { BoardView } from "@/lib/view-mode";
import type { TaskStatus } from "@/lib/types";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { tinyButtonClass } from "@/lib/ui";

type HeaderProps = {
  email: string;
  total: number;
  inProgress: number;
  done: number;
  loading: boolean;
  syncPhase: SyncPhase;
  syncStatus: string;
  view: BoardView;
  signingOut: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onViewChange: (view: BoardView) => void;
  onSignOut: () => void;
};

export function Header({
  email,
  total,
  inProgress,
  done,
  loading,
  syncPhase,
  syncStatus,
  view,
  signingOut,
  refreshing,
  onRefresh,
  onViewChange,
  onSignOut,
}: HeaderProps) {
  const safeTotal = total || 1;
  const initials = email
    .split("@")[0]
    ?.split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

  const pulse =
    syncPhase === "live"
      ? "bg-done"
      : syncPhase === "saving"
        ? "bg-prog"
        : syncPhase === "error"
          ? "bg-todo"
          : "bg-muted";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/75 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface font-display text-sm">
              {initials.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg leading-none tracking-[-0.03em]">Mi tablero</p>
              <p className="truncate text-sm text-muted">{email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-xs text-muted" title={syncStatus}>
              <span className="relative grid h-2.5 w-2.5 place-items-center">
                {syncPhase === "live" ? (
                  <span className={`absolute h-2.5 w-2.5 animate-ping rounded-full opacity-70 ${pulse}`} />
                ) : null}
                <span className={`relative h-2 w-2 rounded-full ${pulse}`} />
              </span>
              <span className="sr-only">{syncStatus}</span>
              <span aria-hidden="true">
                {syncPhase === "live"
                  ? "En vivo"
                  : syncPhase === "saving"
                    ? "Guardando"
                    : syncPhase === "offline"
                      ? "Sin red"
                      : syncPhase === "error"
                        ? "Error"
                        : syncStatus.startsWith("Sincronizando")
                          ? "Sincronizando"
                          : "Cargando"}
              </span>
            </span>
            <div className="flex rounded-xl border border-line bg-surface/60 p-1" role="tablist" aria-label="Vista del tablero">
              <ViewButton current={view} value="kanban" onViewChange={onViewChange}>
                Kanban
              </ViewButton>
              <ViewButton current={view} value="list" onViewChange={onViewChange}>
                Lista
              </ViewButton>
            </div>
            <button
              type="button"
              className={tinyButtonClass}
              onClick={onRefresh}
              disabled={refreshing || loading}
              aria-label="Sincronizar / Refrescar"
            >
              {refreshing ? "Sincronizando…" : "Sincronizar"}
            </button>
            <ThemeToggle />
            <button type="button" className={tinyButtonClass} onClick={onSignOut} disabled={signingOut}>
              {signingOut ? "Saliendo…" : "Salir"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Kpi label="Total" value={loading ? "—" : String(total)} ratio={loading ? 0 : 1} />
          <Kpi
            label="En progreso"
            value={loading ? "—" : String(inProgress)}
            ratio={loading || total === 0 ? 0 : inProgress / safeTotal}
          />
          <Kpi
            label="Terminado"
            value={loading ? "—" : `${total === 0 ? 0 : Math.round((done / total) * 100)}%`}
            ratio={loading || total === 0 ? 0 : done / safeTotal}
          />
        </div>
      </div>
    </header>
  );
}

function ViewButton({
  current,
  value,
  onViewChange,
  children,
}: {
  current: BoardView;
  value: BoardView;
  onViewChange: (view: BoardView) => void;
  children: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`min-h-9 rounded-lg px-3 text-sm transition-all duration-200 ${
        selected ? "bg-accent text-primary-ink" : "text-muted hover:text-ink"
      }`}
      onClick={() => onViewChange(value)}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const dash = 2 * Math.PI * 15;
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface/75 px-3.5 py-3 backdrop-blur-md">
      <div>
        <b className="block font-display text-2xl leading-none tracking-[-0.03em]">{value}</b>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
        <circle cx="20" cy="20" r="15" fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${dash}`}
          strokeDashoffset={dash - dash * clamped}
          transform="rotate(-90 20 20)"
          className="transition-all duration-200"
        />
      </svg>
      <span className="sr-only">{Math.round(clamped * 100)} por ciento</span>
    </article>
  );
}

export function countByStatus(tasks: { status: TaskStatus }[]) {
  return tasks.reduce(
    (counts, task) => {
      counts[task.status] += 1;
      return counts;
    },
    { todo: 0, prog: 0, done: 0 } as Record<TaskStatus, number>,
  );
}
