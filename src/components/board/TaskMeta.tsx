import { dueTone, formatShortDate, type DueTone } from "@/lib/dates";
import { tagHue } from "@/lib/tags";
import type { Subtask, Task, TaskPriority } from "@/lib/types";
import { PRIORITIES } from "@/lib/columns";

const DUE_CLASS: Record<DueTone, string> = {
  overdue: "badge badge-todo",
  today: "badge badge-prog",
  scheduled: "badge badge-muted",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const label = PRIORITIES.find((item) => item.id === priority)?.label ?? "Media";
  const tone = priority === "alta" ? "badge-todo" : priority === "baja" ? "badge-done" : "badge-prog";
  return <span className={`badge ${tone}`}>Prioridad {label.toLowerCase()}</span>;
}

export function DueBadge({ dueDate, muted = false }: { dueDate: string | null; muted?: boolean }) {
  const tone = dueTone(dueDate);
  if (!dueDate || !tone) return null;
  const label =
    tone === "today" ? "Vence hoy" : tone === "overdue" ? `Venció ${formatShortDate(dueDate)}` : formatShortDate(dueDate);
  return <span className={muted ? "badge badge-muted" : DUE_CLASS[tone]}>{label}</span>;
}

export function TagPills({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const hue = tagHue(tag);
        return (
          <span
            key={tag}
            className="rounded-full border px-2 py-px text-[0.72rem] font-medium"
            style={{
              color: `hsl(${hue} 72% 62%)`,
              borderColor: `hsl(${hue} 70% 50% / 0.35)`,
              background: `hsl(${hue} 70% 50% / 0.12)`,
            }}
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}

export function ChecklistMeter({ items }: { items: Subtask[] }) {
  if (items.length === 0) return null;
  const done = items.filter((item) => item.done).length;
  const ratio = done / items.length;
  return (
    <div className="flex items-center gap-2 text-[0.75rem] text-muted">
      <span className="whitespace-nowrap">
        {done}/{items.length} subtareas
      </span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
        <span
          className="block h-full bg-done transition-all duration-200"
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
    </div>
  );
}

export function checklistSummary(task: Pick<Task, "checklist">) {
  const total = task.checklist.length;
  const done = task.checklist.filter((item) => item.done).length;
  return { done, total };
}
