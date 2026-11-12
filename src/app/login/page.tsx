import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Entrar",
};

function LoginFallback() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-5">
      <p className="text-muted" role="status">
        Cargando…
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <AuthScreen />
    </Suspense>
  );
}
