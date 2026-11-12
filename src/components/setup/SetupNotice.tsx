import { ThemeToggle } from "@/components/theme/ThemeToggle";

const steps = [
  "Crea un proyecto en Supabase y, en Authentication, activa el proveedor Email.",
  "Abre el SQL Editor y ejecuta el archivo supabase/schema.sql.",
  "Copia la Project URL y la clave anon en .env.local (hay una plantilla en .env.example).",
  "En Authentication → URL Configuration, agrega http://localhost:3000 y http://localhost:3000/auth/callback.",
  "Reinicia npm run dev.",
];

export function SetupNotice({ showTheme = true }: { showTheme?: boolean }) {
  return (
    <section className="mx-auto w-full max-w-xl rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="font-display text-xl tracking-[-0.02em]">Conecta Supabase</h2>
        {showTheme ? <ThemeToggle /> : null}
      </div>
      <p className="text-sm text-muted">
        El tablero ya está listo. Falta la URL y la clave anon para que cada persona entre con su
        cuenta y vea solo sus pendientes.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
