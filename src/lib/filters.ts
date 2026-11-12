import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

export type TaskFilters = {
  query: string;
  priority: TaskPriority | "all";
  status: TaskStatus | "all";
  hideDone: boolean;
};

export const EMPTY_FILTERS: TaskFilters = {
  query: "",
  priority: "all",
  status: "all",
  hideDone: false,
};

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.hideDone && task.status === "done") return false;
    if (filters.status !== "all" && task.status !== filters.status) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (!query) return true;
    const haystack = `${task.title}\n${task.description}`.toLowerCase();
    return haystack.includes(query);
  });
}
