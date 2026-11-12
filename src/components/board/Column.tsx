"use client";

import { useState, type CSSProperties, type DragEvent } from "react";
import type { ColumnDef } from "@/lib/columns";
import { sortByPriority } from "@/lib/columns";
import type { Subtask, Task, TaskPatch, TaskStatus } from "@/lib/types";
import { TaskCard } from "@/components/board/TaskCard";

type ColumnProps = {
  column: ColumnDef;
  tasks: Task[];
  editingId: string | null;
  canDrag: boolean;
  onEdit: (id: string) => void;
  onCancel: () => void;
  onSave: (id: string, patch: TaskPatch) => Promise<boolean>;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onFocus: (id: string) => void;
  onChecklist: (id: string, checklist: Subtask[]) => void;
};

export function Column({
  column,
  tasks,
  editingId,
  canDrag,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onMove,
  onFocus,
  onChecklist,
}: ColumnProps) {
  const [over, setOver] = useState(false);
  const items = sortByPriority(tasks.filter((task) => task.status === column.id));
  const style = {
    background: "var(--col)",
    outlineColor: column.color,
    "--c": column.color,
  } as CSSProperties;

  function onDragOver(event: DragEvent<HTMLElement>) {
    if (!canDrag) return;
    event.preventDefault();
    setOver(true);
  }

  function onDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
  }

  return (
    <section
      className={`min-h-60 rounded-2xl border border-line p-3 transition-all duration-200 ${
        over ? "ring-2 ring-accent/50" : ""
      }`}
      style={style}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        if (!canDrag) return;
        event.preventDefault();
        setOver(false);
        const id = event.dataTransfer.getData("text/plain");
        if (id) onMove(id, column.id);
      }}
    >
      <h2 className="mb-3 flex items-center justify-between gap-2 px-1 font-display text-sm tracking-wide">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: column.color }} />
          {column.name}
        </span>
        <span className="rounded-full border border-line bg-surface/80 px-2 py-px font-sans text-xs text-muted">
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line px-2 py-8 text-center text-sm text-muted">
          Nada por aquí. Arrastra una tarjeta o crea una nueva.
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-2.5 p-0">
          {items.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                editing={editingId === task.id}
                canDrag={canDrag && editingId !== task.id}
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
      )}
    </section>
  );
}
