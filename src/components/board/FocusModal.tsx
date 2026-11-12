"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { haptic } from "@/lib/haptic";
import { primaryButtonClass, tinyButtonClass } from "@/lib/ui";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Phase = "focus" | "break";

type TimerState = {
  phase: Phase;
  seconds: number;
  running: boolean;
};

type FocusModalProps = {
  task: Task;
  onClose: () => void;
};

export function FocusModal({ task, onClose }: FocusModalProps) {
  const [timer, setTimer] = useState<TimerState>({
    phase: "focus",
    seconds: FOCUS_SECONDS,
    running: false,
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(() => {
      setTimer((current) => {
        if (!current.running) return current;
        if (current.seconds > 1) return { ...current, seconds: current.seconds - 1 };
        const next: Phase = current.phase === "focus" ? "break" : "focus";
        haptic();
        return {
          phase: next,
          seconds: next === "break" ? BREAK_SECONDS : FOCUS_SECONDS,
          running: false,
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);

  const minutes = String(Math.floor(timer.seconds / 60)).padStart(2, "0");
  const seconds = String(timer.seconds % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-title"
        className="grid w-full max-w-lg gap-5 rounded-3xl border border-line bg-bg/90 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">
              {timer.phase === "focus" ? "Enfoque · 25 min" : "Descanso · 5 min"}
            </p>
            <h2 id="focus-title" className="mt-1 font-display text-2xl tracking-[-0.03em]">
              {task.title}
            </h2>
          </div>
          <button type="button" className={tinyButtonClass} onClick={onClose}>
            Cerrar
          </button>
        </div>
        <p className="font-display text-6xl tabular-nums tracking-[-0.04em]">
          {minutes}:{seconds}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => setTimer((current) => ({ ...current, running: !current.running }))}
          >
            {timer.running ? "Pausar" : "Iniciar"}
          </button>
          <button
            type="button"
            className={tinyButtonClass}
            onClick={() =>
              setTimer({
                phase: "focus",
                seconds: FOCUS_SECONDS,
                running: false,
              })
            }
          >
            Reiniciar
          </button>
        </div>
        <div className="rounded-2xl border border-line bg-surface/70 p-4">
          <p className="mb-2 text-xs text-muted">Notas</p>
          <p className="text-sm whitespace-pre-wrap text-ink">
            {task.description || "Sin notas en esta tarea."}
          </p>
        </div>
      </section>
    </div>
  );
}
