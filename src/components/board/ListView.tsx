"use client";

import { sortByPriority } from "@/lib/columns";
import type { Subtask, Task, TaskPatch, TaskStatus } from "@/lib/types";
import { TaskCard } from "@/components/board/TaskCard";

type ListViewProps = {
  tasks: Task[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancel: () => void;
  onSave: (id: string, patch: TaskPatch) => Promise<boolean>;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onFocus: (id: string) => void;
  onChecklist: (id: string, checklist: Subtask[]) => void;
};

export function ListView({
  tasks,
  editingId,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onMove,
  onFocus,
  onChecklist,
}: ListViewProps) {
  const items = sortByPriority(tasks);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
        Ningún pendiente coincide con la búsqueda o los filtros.
      </div>
    );
  }

  return (
    <ul className="m-0 grid list-none gap-2 rounded-2xl border border-line bg-surface/40 p-2 backdrop-blur-md">
      {items.map((task) => (
        <li key={task.id}>
          <TaskCard
            task={task}
            editing={editingId === task.id}
            canDrag={false}
            showMoves
            onEdit={() => onEdit(task.id)}
            onCancel={onCancel}
            onSave={(patch) => onSave(task.id, patch)}
            onDelete={() => onDelete(task.id)}
            onMove={(status) => onMove(task.id, status)}
            onFocus={() => onFocus(task.id)}
            onChecklist={(checklist) => onChecklist(task.id, checklist)}
          />
        </li>
      ))}
    </ul>
  );
}
