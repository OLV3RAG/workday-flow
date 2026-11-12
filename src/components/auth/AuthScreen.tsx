import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { SetupNotice } from "@/components/setup/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function AuthScreen() {
  const configured = isSupabaseConfigured();

  if (configured) {
    await connection();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-[safe_center] gap-4 px-5 py-8">
      {configured ? null : <SetupNotice showTheme={false} />}
      <AuthForm configured={configured} />
    </main>
  );
}
