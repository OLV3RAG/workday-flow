function readSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || url.includes("YOUR_PROJECT")) return undefined;
  return url;
}

function readSupabaseKey(): string | undefined {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const key = publishable || anon;
  if (!key || key.includes("your-anon") || key.includes("YOUR_KEY")) return undefined;
  return key;
}

export function isSupabaseConfigured(): boolean {
  const url = readSupabaseUrl();
  const key = readSupabaseKey();
  if (!url || !key) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function requireSupabaseEnv(): { url: string; key: string } {
  const url = readSupabaseUrl();
  const key = readSupabaseKey();

  if (!url || !key) {
    throw new Error("Supabase no está configurado.");
  }

  return { url, key };
}
