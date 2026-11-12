import type { TaskPriority, TaskStatus } from "@/lib/types";

export type ColumnDef = {
  id: TaskStatus;
  name: string;
  short: string;
  color: string;
};

export const COLUMNS: ColumnDef[] = [
  { id: "todo", name: "Por hacer (TO DO)", short: "Por hacer", color: "var(--todo)" },
  {
    id: "prog",
    name: "En progreso (IN PROGRESS)",
    short: "En progreso",
    color: "var(--prog)",
  },
  {
    id: "done",
    name: "Terminado (FINISHED)",
    short: "Terminado",
    color: "var(--done)",
  },
];

export const PRIORITIES: { id: TaskPriority; label: string; rank: number }[] = [
  { id: "alta", label: "Alta", rank: 0 },
  { id: "media", label: "Media", rank: 1 },
  { id: "baja", label: "Baja", rank: 2 },
];

export function priorityRank(priority: TaskPriority): number {
  return PRIORITIES.find((item) => item.id === priority)?.rank ?? 1;
}

export function sortByPriority<T extends { priority: TaskPriority; created_at: string }>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
    if (byPriority !== 0) return byPriority;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function columnByStatus(status: TaskStatus): ColumnDef {
  return COLUMNS.find((column) => column.id === status) ?? COLUMNS[0];
}

export function previousStatus(status: TaskStatus): TaskStatus | null {
  const index = COLUMNS.findIndex((column) => column.id === status);
  return index > 0 ? COLUMNS[index - 1].id : null;
}

export function nextStatus(status: TaskStatus): TaskStatus | null {
  const index = COLUMNS.findIndex((column) => column.id === status);
  return index >= 0 && index < COLUMNS.length - 1 ? COLUMNS[index + 1].id : null;
}

export function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function moveLabel(target: TaskStatus, direction: "prev" | "next"): string {
  const name = columnByStatus(target).short;
  return direction === "prev" ? `← ${name}` : `${name} →`;
}
