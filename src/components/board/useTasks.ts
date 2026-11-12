"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  parseTask,
  type Task,
  type TaskDraft,
  type TaskPatch,
  type TaskStatus,
  type TaskUpdate,
} from "@/lib/types";

export type SyncPhase = "loading" | "live" | "saving" | "offline" | "error";

type PostgrestLikeError = {
  message: string;
  code?: string;
};

function errorMessage(error: PostgrestLikeError): string {
  const text = `${error.code ?? ""} ${error.message}`.toLowerCase();
  if (text.includes("due_date") || text.includes("checklist") || text.includes("tags")) {
    return "Faltan columnas nuevas. Vuelve a ejecutar supabase/schema.sql en el SQL Editor.";
  }
  if (error.code === "42P01" || text.includes("does not exist") || text.includes("schema cache")) {
    return "No se encontró la tabla tasks. Ejecuta supabase/schema.sql en el SQL Editor.";
  }
  if (error.code === "42501" || text.includes("row-level security")) {
    return "No tienes permiso sobre estos pendientes. Revisa las políticas RLS.";
  }
  if (error.code === "23514") {
    return "Algún dato no es válido. Revisa el título, la fecha o las subtareas.";
  }
  return "No se pudo guardar. Inténtalo de nuevo.";
}

function upsertTask(tasks: Task[], task: Task): Task[] {
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index === -1) return [...tasks, task];
  const next = tasks.slice();
  next[index] = task;
  return next;
}

export function useTasks(userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const phaseRef = useRef<SyncPhase>("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("loading");
  const [syncStatus, setSyncStatus] = useState("Cargando…");

  const setSync = useCallback((phase: SyncPhase, message: string) => {
    phaseRef.current = phase;
    setSyncPhase(phase);
    setSyncStatus(message);
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSync("loading", "Cargando…");
    const { data, error: loadError } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(errorMessage(loadError));
      setSync("error", "No se pudo sincronizar");
      setLoading(false);
      return;
    }

    const parsed = (data ?? []).map(parseTask).filter((task): task is Task => task !== null);
    setTasks(parsed);
    setSync("live", "En vivo");
    setLoading(false);
  }, [setSync, supabase]);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      setLoading(true);
      setSync("loading", "Cargando…");
      const { data, error: loadError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (!active) return;

      if (loadError) {
        setError(errorMessage(loadError));
        setSync("error", "No se pudo sincronizar");
        setLoading(false);
        return;
      }

      const parsed = (data ?? []).map(parseTask).filter((task): task is Task => task !== null);
      setTasks(parsed);
      setSync("live", "En vivo");
      setLoading(false);
    }

    void initialLoad();
    return () => {
      active = false;
    };
  }, [setSync, supabase]);

  useEffect(() => {
    const apply = (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      if (payload.eventType === "DELETE") {
        const id = typeof payload.old.id === "string" ? payload.old.id : "";
        if (!id) return;
        setTasks((current) => current.filter((task) => task.id !== id));
        return;
      }

      const task = parseTask(payload.new);
      if (!task || task.user_id !== userId) return;
      setTasks((current) => upsertTask(current, task));
    };

    const changes = { schema: "public", table: "tasks", filter: `user_id=eq.${userId}` } as const;
    const channel = supabase
      .channel("tasks-channel")
      .on("postgres_changes", { event: "INSERT", ...changes }, apply)
      .on("postgres_changes", { event: "UPDATE", ...changes }, apply)
      .on("postgres_changes", { event: "DELETE", ...changes }, apply)
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && phaseRef.current !== "saving") {
          setSync("live", "En vivo");
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSync("offline", "Sin conexión en vivo. Los cambios se guardan igual.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [setSync, supabase, userId]);

  const createTask = useCallback(
    async (draft: TaskDraft) => {
      setSync("saving", "Guardando…");
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          title: draft.title,
          description: draft.description,
          status: draft.status,
          priority: draft.priority,
          due_date: draft.due_date,
          tags: draft.tags,
        })
        .select("*")
        .single();

      if (insertError) {
        setSync("error", errorMessage(insertError));
        return false;
      }

      const task = parseTask(data);
      if (task) setTasks((current) => upsertTask(current, task));
      setSync("live", "En vivo");
      return true;
    },
    [setSync, supabase],
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskUpdate) => {
      const snapshot = tasksRef.current;
      setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
      setSync("saving", "Guardando…");

      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) {
        setTasks(snapshot);
        setSync("error", errorMessage(updateError));
        return false;
      }

      const task = parseTask(data);
      if (task) setTasks((current) => upsertTask(current, task));
      setSync("live", "En vivo");
      return true;
    },
    [setSync, supabase],
  );

  const moveTask = useCallback(
    async (id: string, status: TaskStatus) => {
      const currentTask = tasksRef.current.find((task) => task.id === id);
      if (!currentTask || currentTask.status === status) return true;
      return updateTask(id, { status });
    },
    [updateTask],
  );

  const saveTask = useCallback(
    async (id: string, patch: TaskPatch) => updateTask(id, patch),
    [updateTask],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const snapshot = tasksRef.current;
      setTasks((current) => current.filter((task) => task.id !== id));
      setSync("saving", "Guardando…");
      const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
      if (deleteError) {
        setTasks(snapshot);
        setSync("error", errorMessage(deleteError));
        return false;
      }
      setSync("live", "En vivo");
      return true;
    },
    [setSync, supabase],
  );

  return {
    tasks,
    loading,
    error,
    syncPhase,
    syncStatus,
    reload: load,
    createTask,
    saveTask,
    updateTask,
    moveTask,
    deleteTask,
  };
}
