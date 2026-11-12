"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, fieldClass, primaryButtonClass } from "@/lib/ui";

type Mode = "login" | "signup";

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (lower.includes("email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (lower.includes("password")) return "La contraseña debe tener al menos 6 caracteres.";
  if (lower.includes("valid email") || lower.includes("unable to validate email")) {
    return "Escribe un correo válido.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  }
  return "No se pudo completar la acción. Revisa los datos e inténtalo de nuevo.";
}

export function AuthForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState(
    searchParams.get("error") === "confirmacion"
      ? "El enlace de confirmación no es válido o ya expiró."
      : "",
  );
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!configured) {
      setError("Configura Supabase en .env.local y reinicia el servidor.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setPending(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setPending(false);
      if (signUpError) {
        setError(authErrorMessage(signUpError.message));
        return;
      }
      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }
      setInfo("Te enviamos un correo para confirmar la cuenta. Ábrelo y luego inicia sesión.");
      setMode("login");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signInError) {
      setError(authErrorMessage(signInError.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[2rem] leading-none tracking-[-0.02em]">
            Mi tablero de trabajo
          </h1>
          <p className="mt-1 text-sm text-muted">Entra para ver solo tus pendientes.</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2" role="tablist" aria-label="Acceso">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? primaryButtonClass : buttonClass}
          onClick={() => {
            setMode("login");
            setError("");
            setInfo("");
          }}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? primaryButtonClass : buttonClass}
          onClick={() => {
            setMode("signup");
            setError("");
            setInfo("");
          }}
        >
          Crear cuenta
        </button>
      </div>

      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          Correo
          <input
            className={fieldClass}
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-label="Correo"
            placeholder="tu@correo.com"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Contraseña
          <input
            className={fieldClass}
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            aria-label="Contraseña"
            placeholder="Mínimo 6 caracteres"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-todo">
            {error}
          </p>
        ) : null}
        {info ? (
          <p role="status" className="text-sm text-done">
            {info}
          </p>
        ) : null}
        <button className={primaryButtonClass} type="submit" disabled={pending}>
          {pending ? "Espera…" : mode === "signup" ? "Crear cuenta" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
