"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COLUMNS } from "@/lib/columns";
import { EMPTY_FILTERS, filterTasks } from "@/lib/filters";
import { haptic } from "@/lib/haptic";
import { createClient } from "@/lib/supabase/client";
import type { Subtask, TaskStatus } from "@/lib/types";
import { getViewSnapshot, setStoredView, subscribeView, type BoardView } from "@/lib/view-mode";
import { buttonClass } from "@/lib/ui";
import { Column } from "@/components/board/Column";
import { FilterBar } from "@/components/board/FilterBar";
import { FocusModal } from "@/components/board/FocusModal";
import { countByStatus, Header } from "@/components/board/Header";
import { ListView } from "@/components/board/ListView";
import { NewTaskForm } from "@/components/board/NewTaskForm";
import { useTasks } from "@/components/board/useTasks";

type BoardProps = {
  userId: string;
  email: string;
};

export function Board({ userId, email }: BoardProps) {
  const router = useRouter();
  const {
    tasks,
    loading,
    error,
    syncPhase,
    syncStatus,
    reload,
    refreshing,
    createTask,
    saveTask,
    updateTask,
    moveTask,
    deleteTask,
  } = useTasks(userId);
  const [view, setView] = useState<BoardView>("kanban");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [canDrag, setCanDrag] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 901px) and (hover: hover) and (pointer: fine)");
    const update = () => setCanDrag(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const syncView = () => setView(getViewSnapshot());
    syncView();
    return subscribeView(syncView);
  }, []);

  const counts = countByStatus(tasks);
  const visible = useMemo(() => filterTasks(tasks, filters), [filters, tasks]);
  const columns = COLUMNS.filter((column) => !(filters.hideDone && column.id === "done"));
  const focusTask = tasks.find((task) => task.id === focusId) ?? null;

  const closeFocus = useCallback(() => setFocusId(null), []);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setSigningOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  async function removeTask(id: string) {
    const ok = await deleteTask(id);
    if (ok && editingId === id) setEditingId(null);
    if (ok && focusId === id) setFocusId(null);
  }

  function changeStatus(id: string, status: TaskStatus) {
    haptic();
    void moveTask(id, status);
  }

  const cardActions = {
    editingId,
    onEdit: setEditingId,
    onCancel: () => setEditingId(null),
    onSave: saveTask,
    onDelete: (id: string) => {
      void removeTask(id);
    },
    onMove: changeStatus,
    onFocus: setFocusId,
    onChecklist: (id: string, checklist: Subtask[]) => {
      void updateTask(id, { checklist });
    },
  };

  return (
    <div className="min-h-dvh">
      <Header
        email={email}
        total={tasks.length}
        inProgress={counts.prog}
        done={counts.done}
        loading={loading}
        syncPhase={error ? "error" : syncPhase}
        syncStatus={error || syncStatus}
        view={view}
        signingOut={signingOut}
        refreshing={refreshing}
        onRefresh={() => {
          void reload();
        }}
        onViewChange={setStoredView}
        onSignOut={() => {
          void signOut();
        }}
      />
      <div className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 py-4 pb-16">
        <FilterBar filters={filters} shown={visible.length} total={tasks.length} onChange={setFilters} />
        <NewTaskForm disabled={loading} onCreate={createTask} />
        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-todo/40 bg-todo/10 px-4 py-3">
            <p role="alert" className="text-sm">
              {error}
            </p>
            <button type="button" className={buttonClass} onClick={() => void reload()}>
              Reintentar
            </button>
          </div>
        ) : null}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 min-[901px]:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.id} className="min-h-60 animate-pulse rounded-2xl border border-line bg-col" />
            ))}
          </div>
        ) : view === "list" ? (
          <ListView tasks={visible} {...cardActions} />
        ) : (
          <main className="grid grid-cols-1 items-start gap-3 min-[901px]:grid-cols-3">
            {columns.map((column) => (
              <Column key={column.id} column={column} tasks={visible} canDrag={canDrag} {...cardActions} />
            ))}
          </main>
        )}
      </div>
      {focusTask ? <FocusModal task={focusTask} onClose={closeFocus} /> : null}
    </div>
  );
}
