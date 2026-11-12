import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Board } from "@/components/board/Board";
import { SetupNotice } from "@/components/setup/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function BoardScreen() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-[safe_center] px-5 py-8">
        <SetupNotice />
      </main>
    );
  }

  // Supabase compara la caducidad del token con Date.now(). Eso no puede
  // ejecutarse en el prerender; a partir de aquí la pantalla se resuelve por request.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <Board userId={user.id} email={user.email ?? "Sesión activa"} />;
}
