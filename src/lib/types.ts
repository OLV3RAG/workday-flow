export type TaskStatus = "todo" | "prog" | "done";
export type TaskPriority = "alta" | "media" | "baja";

export type Subtask = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  checklist: Subtask[];
  created_at: string;
  updated_at: string;
};

export type TaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
};

export type TaskPatch = {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
};

export type TaskUpdate = Partial<
  Pick<Task, "title" | "description" | "status" | "priority" | "due_date" | "tags" | "checklist">
>;

export function isTaskStatus(value: string): value is TaskStatus {
  return value === "todo" || value === "prog" || value === "done";
}

export function isTaskPriority(value: string): value is TaskPriority {
  return value === "alta" || value === "media" || value === "baja";
}

export function parseChecklist(value: unknown): Subtask[] {
  if (!Array.isArray(value)) return [];
  const items: Subtask[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.text !== "string") continue;
    const text = row.text.trim();
    if (!text) continue;
    items.push({ id: row.id, text, done: row.done === true });
  }
  return items;
}

export function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const tag = entry.trim();
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function parseTask(value: unknown): Task | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.user_id !== "string") return null;
  if (typeof row.title !== "string") return null;
  if (typeof row.status !== "string" || !isTaskStatus(row.status)) return null;
  if (typeof row.priority !== "string" || !isTaskPriority(row.priority)) return null;
  if (typeof row.created_at !== "string") return null;

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: typeof row.description === "string" ? row.description : "",
    status: row.status,
    priority: row.priority,
    due_date: typeof row.due_date === "string" ? row.due_date : null,
    tags: parseTags(row.tags),
    checklist: parseChecklist(row.checklist),
    created_at: row.created_at,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : row.created_at,
  };
}

export function createSubtaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sub-${Math.random().toString(36).slice(2, 10)}`;
}
