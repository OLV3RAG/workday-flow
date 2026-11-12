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
  details?: string | null;
  hint?: string | null;
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

function reportError(action: string, error: PostgrestLikeError): string {
  console.error(`[tasks] ${action}`, error);
  const friendly = errorMessage(error);
  const detail = error.message.trim();
  if (!detail || friendly.includes(detail)) return friendly;
  return `${friendly} (${detail})`;
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("loading");
  const [syncStatus, setSyncStatus] = useState("Cargando…");
  const loadedRef = useRef(false);
  const subscribedRef = useRef(false);

  const setSync = useCallback((phase: SyncPhase, message: string) => {
    phaseRef.current = phase;
    setSyncPhase(phase);
    setSyncStatus(message);
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const load = useCallback(async () => {
    await Promise.resolve();
    const firstLoad = !loadedRef.current;
    if (firstLoad) {
      setLoading(true);
      setSync("loading", "Cargando…");
    } else {
      setRefreshing(true);
      setSync("loading", "Sincronizando…");
    }
    setError("");

    const { data, error: loadError } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (loadError) {
      const message = reportError("select", loadError);
      setError(message);
      setSync("error", message);
      setLoading(false);
      setRefreshing(false);
      return false;
    }

    const rows = data ?? [];
    const parsed = rows.map(parseTask).filter((task): task is Task => task !== null);
    if (parsed.length !== rows.length) {
      console.error("[tasks] select", `${rows.length - parsed.length} filas no coinciden con el formato esperado`);
    }
    setTasks(parsed);
    loadedRef.current = true;
    setLoading(false);
    setRefreshing(false);
    if (subscribedRef.current) setSync("live", "En vivo");
    else if (!firstLoad) setSync("offline", "Tareas actualizadas. La conexión en vivo sigue pendiente.");
    return true;
  }, [setSync, supabase, userId]);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const apply = (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      if (payload.eventType === "DELETE") {
        const id = typeof payload.old.id === "string" ? payload.old.id : "";
        const owner = typeof payload.old.user_id === "string" ? payload.old.user_id : "";
        if (!id || (owner && owner !== userId)) return;
        setTasks((current) => current.filter((task) => task.id !== id));
        return;
      }

      const task = parseTask(payload.new);
      if (!task) {
        console.error("[tasks] realtime", payload.eventType, payload.new);
        return;
      }
      if (task.user_id !== userId) return;
      setTasks((current) => upsertTask(current, task));
    };

    async function connect() {
      const current = ++generation;
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!active || current !== generation) return;
      if (sessionError) console.error("[tasks] session", sessionError);
      const token = sessionData.session?.access_token;
      if (token) await supabase.realtime.setAuth(token);
      if (!active || current !== generation) return;

      if (channel) {
        const previous = channel;
        channel = null;
        await supabase.removeChannel(previous);
      }
      if (!active || current !== generation) return;

      const changes = { schema: "public", table: "tasks", filter: `user_id=eq.${userId}` } as const;
      channel = supabase
        .channel(`tasks-channel:${userId}`, { config: { private: true } })
        .on("postgres_changes", { event: "INSERT", ...changes }, apply)
        .on("postgres_changes", { event: "UPDATE", ...changes }, apply)
        .on("postgres_changes", { event: "DELETE", ...changes }, apply)
        .subscribe((status, subscribeError) => {
          if (!active || current !== generation) return;
          if (status === "SUBSCRIBED") {
            subscribedRef.current = true;
            if (phaseRef.current !== "saving") setSync("live", "En vivo");
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            subscribedRef.current = false;
            console.error("[tasks] realtime", status, subscribeError);
            setSync("offline", "Sin conexión en vivo. Pulsa Sincronizar para traer los cambios.");
          }
        });
    }

    queueMicrotask(() => {
      if (!active) return;
      void load();
    });
    void connect();

    function onVisibility() {
      if (document.visibilityState !== "visible") return;
      void load();
      void connect();
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      generation += 1;
      document.removeEventListener("visibilitychange", onVisibility);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load, setSync, supabase, userId]);

  const createTask = useCallback(
    async (draft: TaskDraft) => {
      setSync("saving", "Guardando…");
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
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
        const message = reportError("insert", insertError);
        setError(message);
        setSync("error", message);
        return false;
      }

      const task = parseTask(data);
      if (!task) {
        console.error("[tasks] insert", data);
        setError("La tarea se guardó, pero la respuesta no tiene el formato esperado.");
        setSync("error", "Respuesta inesperada al crear");
        return false;
      }
      setTasks((current) => upsertTask(current, task));
      setError("");
      setSync("live", "En vivo");
      return true;
    },
    [setSync, supabase, userId],
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
        .eq("user_id", userId)
        .select("*")
        .single();

      if (updateError) {
        setTasks(snapshot);
        const message = reportError("update", updateError);
        setError(message);
        setSync("error", message);
        return false;
      }

      const task = parseTask(data);
      if (!task) {
        console.error("[tasks] update", data);
        setTasks(snapshot);
        setError("El cambio se guardó, pero la respuesta no tiene el formato esperado.");
        setSync("error", "Respuesta inesperada al guardar");
        return false;
      }
      setTasks((current) => upsertTask(current, task));
      setError("");
      setSync("live", "En vivo");
      return true;
    },
    [setSync, supabase, userId],
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
      const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
      if (deleteError) {
        setTasks(snapshot);
        const message = reportError("delete", deleteError);
        setError(message);
        setSync("error", message);
        return false;
      }
      setError("");
      setSync("live", "En vivo");
      return true;
    },
    [setSync, supabase, userId],
  );

  return {
    tasks,
    loading,
    refreshing,
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
