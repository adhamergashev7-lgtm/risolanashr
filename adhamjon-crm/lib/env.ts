export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Supabase kalitlari bo'lmasa — demo rejim: ma'lumotlar brauzerda (localStorage) saqlanadi */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function isDemoMode() {
  return !isSupabaseConfigured();
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://sizning-domeningiz.uz").replace(/\/$/, "");
}
