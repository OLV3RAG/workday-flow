"use client";

import { buttonClass } from "@/lib/ui";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-5">
      <h1 className="font-display text-3xl tracking-[-0.02em]">No se pudo cargar la página</h1>
      <p className="text-muted">Vuelve a intentarlo. Si acabas de iniciar sesión, recarga el tablero.</p>
      <button type="button" className={`${buttonClass} w-fit`} onClick={() => reset()}>
        Reintentar
      </button>
    </main>
  );
}
