"use client";

import { FormEvent, useState } from "react";
import { COLUMNS, PRIORITIES } from "@/lib/columns";
import { fromDateInput } from "@/lib/dates";
import { normalizeTags } from "@/lib/tags";
import { isTaskPriority, isTaskStatus, type TaskDraft } from "@/lib/types";
import { fieldClass, primaryButtonClass, tinyButtonClass } from "@/lib/ui";
import { TagEditor } from "@/components/board/TagEditor";

type NewTaskFormProps = {
  disabled?: boolean;
  onCreate: (draft: TaskDraft) => Promise<boolean>;
};

export function NewTaskForm({ disabled = false, onCreate }: NewTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const statusValue = String(data.get("status") ?? "todo");
    const priorityValue = String(data.get("priority") ?? "media");
    const dueValue = String(data.get("due") ?? "");

    if (!title) {
      setError("El título es obligatorio.");
      return;
    }
    if (!isTaskStatus(statusValue) || !isTaskPriority(priorityValue)) {
      setError("Elige una columna y una prioridad válidas.");
      return;
    }

    setPending(true);
    const ok = await onCreate({
      title,
      description,
      status: statusValue,
      priority: priorityValue,
      due_date: fromDateInput(dueValue),
      tags: normalizeTags(tags),
    });
    setPending(false);
    if (!ok) {
      setError("No se pudo agregar el pendiente.");
      return;
    }
    form.reset();
    setTags([]);
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" className={primaryButtonClass} onClick={() => setOpen(true)} disabled={disabled}>
        Nueva tarea
      </button>
    );
  }

  return (
    <form className="grid gap-3 rounded-2xl border border-line bg-surface/75 p-4 backdrop-blur-md" onSubmit={onSubmit}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg tracking-[-0.03em]">Nueva tarea</h2>
        <button type="button" className={tinyButtonClass} onClick={() => setOpen(false)}>
          Cerrar
        </button>
      </div>
      <input
        className={fieldClass}
        name="title"
        placeholder="Título del pendiente"
        required
        maxLength={120}
        aria-label="Título"
        disabled={disabled || pending}
      />
      <textarea
        className={fieldClass}
        name="description"
        placeholder="Descripción, enlaces, notas…"
        rows={2}
        aria-label="Descripción"
        disabled={disabled || pending}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={fieldClass} name="status" aria-label="Columna inicial" defaultValue="todo" disabled={disabled || pending}>
          {COLUMNS.map((column) => (
            <option key={column.id} value={column.id}>
              {column.short}
            </option>
          ))}
        </select>
        <select className={fieldClass} name="priority" aria-label="Prioridad" defaultValue="media" disabled={disabled || pending}>
          {PRIORITIES.map((priority) => (
            <option key={priority.id} value={priority.id}>
              Prioridad {priority.label.toLowerCase()}
            </option>
          ))}
        </select>
        <input className={fieldClass} type="date" name="due" aria-label="Fecha límite" disabled={disabled || pending} />
      </div>
      <TagEditor tags={tags} onChange={setTags} />
      {error ? (
        <p role="alert" className="text-sm text-todo">
          {error}
        </p>
      ) : null}
      <button className={primaryButtonClass} type="submit" disabled={disabled || pending}>
        {pending ? "Agregando…" : "Agregar pendiente"}
      </button>
    </form>
  );
}
