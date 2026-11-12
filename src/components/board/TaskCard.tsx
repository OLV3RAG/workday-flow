"use client";

import { FormEvent, useState } from "react";
import { moveLabel, nextStatus, previousStatus } from "@/lib/columns";
import { fromDateInput, toDateInput } from "@/lib/dates";
import { haptic } from "@/lib/haptic";
import { createSubtaskId, isTaskPriority, type Subtask, type Task, type TaskPatch, type TaskStatus } from "@/lib/types";
import { fieldClass, primaryButtonClass, tinyButtonClass } from "@/lib/ui";
import { ChecklistMeter, DueBadge, PriorityBadge, TagPills } from "@/components/board/TaskMeta";
import { TagEditor } from "@/components/board/TagEditor";
import { PRIORITIES } from "@/lib/columns";

type TaskCardProps = {
  task: Task;
  editing: boolean;
  canDrag: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: TaskPatch) => Promise<boolean>;
  onDelete: () => void;
  onMove: (status: TaskStatus) => void;
  onFocus: () => void;
  onChecklist: (checklist: Subtask[]) => void;
  showMoves?: boolean;
};

export function TaskCard(props: TaskCardProps) {
  if (props.editing) return <TaskEditor {...props} />;
  return <TaskSummary {...props} />;
}

function TaskSummary({
  task,
  canDrag,
  onEdit,
  onDelete,
  onMove,
  onFocus,
  onChecklist,
  showMoves = false,
}: TaskCardProps) {
  const [dragging, setDragging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const previous = previousStatus(task.status);
  const following = nextStatus(task.status);

  function move(status: TaskStatus) {
    haptic();
    onMove(status);
  }

  function toggleSubtask(id: string) {
    const checklist = task.checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    );
    const turnedOn = checklist.find((item) => item.id === id)?.done;
    if (turnedOn) haptic();
    onChecklist(checklist);
  }

  return (
    <article
      className={`rounded-2xl border border-line bg-surface/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30 ${
        dragging ? "scale-[0.98] opacity-50" : ""
      } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ borderLeft: "3px solid var(--c)" }}
      draggable={canDrag}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        <DueBadge dueDate={task.due_date} muted={task.status === "done"} />
      </div>
      <h3
        className={`text-[0.98rem] font-semibold [overflow-wrap:anywhere] ${
          task.status === "done" ? "text-muted line-through" : ""
        }`}
      >
        {task.title}
      </h3>
      {task.description ? (
        <p className="mt-1 line-clamp-3 text-sm whitespace-pre-wrap text-muted [overflow-wrap:anywhere]">
          {task.description}
        </p>
      ) : null}
      <div className="mt-2 grid gap-2">
        <TagPills tags={task.tags} />
        <ChecklistMeter items={task.checklist} />
      </div>
      {task.checklist.length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {task.checklist.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={item.done}
                  onChange={() => toggleSubtask(item.id)}
                />
                <span className={item.done ? "text-muted line-through" : ""}>{item.text}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <div className={showMoves ? "flex flex-wrap gap-1.5" : "move-actions"}>
          {previous ? (
            <button type="button" className={tinyButtonClass} onClick={() => move(previous)}>
              {moveLabel(previous, "prev")}
            </button>
          ) : null}
          {following ? (
            <button type="button" className={tinyButtonClass} onClick={() => move(following)}>
              {moveLabel(following, "next")}
            </button>
          ) : null}
        </div>
        {task.status === "prog" ? (
          <button type="button" className={tinyButtonClass} onClick={onFocus}>
            Focus
          </button>
        ) : null}
        <button type="button" className={tinyButtonClass} onClick={onEdit}>
          Editar
        </button>
        {confirming ? (
          <>
            <button type="button" className={`${tinyButtonClass} text-todo`} onClick={onDelete}>
              Confirmar
            </button>
            <button type="button" className={tinyButtonClass} onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className={`${tinyButtonClass} text-todo`} onClick={() => setConfirming(true)}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}

function TaskEditor({ task, onCancel, onSave, onChecklist }: TaskCardProps) {
  const [tags, setTags] = useState(task.tags);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftItem, setDraftItem] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const priorityValue = String(data.get("priority") ?? "media");
    const dueValue = String(data.get("due") ?? "");
    if (!title) {
      setError("El título es obligatorio.");
      return;
    }
    if (!isTaskPriority(priorityValue)) {
      setError("Elige una prioridad válida.");
      return;
    }
    setSaving(true);
    const ok = await onSave({
      title,
      description,
      priority: priorityValue,
      due_date: fromDateInput(dueValue),
      tags,
    });
    setSaving(false);
    if (!ok) setError("No se pudieron guardar los cambios.");
  }

  function addSubtask() {
    const text = draftItem.trim();
    if (!text) return;
    onChecklist([...task.checklist, { id: createSubtaskId(), text, done: false }]);
    setDraftItem("");
  }

  return (
    <form
      className="grid gap-2 rounded-2xl border border-line bg-surface p-3"
      style={{ borderLeft: "3px solid var(--c)" }}
      onSubmit={onSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <input className={fieldClass} name="title" defaultValue={task.title} aria-label="Título" maxLength={120} required autoFocus />
      <textarea className={fieldClass} name="description" defaultValue={task.description} rows={3} aria-label="Descripción" />
      <div className="grid gap-2 sm:grid-cols-2">
        <select className={fieldClass} name="priority" aria-label="Prioridad" defaultValue={task.priority}>
          {PRIORITIES.map((item) => (
            <option key={item.id} value={item.id}>
              Prioridad {item.label.toLowerCase()}
            </option>
          ))}
        </select>
        <input className={fieldClass} type="date" name="due" aria-label="Fecha límite" defaultValue={toDateInput(task.due_date)} />
      </div>
      <TagEditor tags={tags} onChange={setTags} />
      <div className="grid gap-1.5">
        <p className="text-xs text-muted">Subtareas</p>
        {task.checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              aria-label={item.text}
              onChange={() => {
                const checklist = task.checklist.map((entry) =>
                  entry.id === item.id ? { ...entry, done: !entry.done } : entry,
                );
                if (!item.done) haptic();
                onChecklist(checklist);
              }}
            />
            <span className={`flex-1 text-sm ${item.done ? "text-muted line-through" : ""}`}>{item.text}</span>
            <button
              type="button"
              className={tinyButtonClass}
              onClick={() => onChecklist(task.checklist.filter((entry) => entry.id !== item.id))}
            >
              Quitar
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            className={fieldClass}
            value={draftItem}
            onChange={(event) => setDraftItem(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSubtask();
              }
            }}
            placeholder="Nueva subtarea"
            aria-label="Nueva subtarea"
          />
          <button type="button" className={tinyButtonClass} onClick={addSubtask}>
            Añadir
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-todo">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <button className={primaryButtonClass} type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        <button className={tinyButtonClass} type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
