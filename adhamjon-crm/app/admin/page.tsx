import { redirect } from "next/navigation";
import { Dashboard } from "@/components/admin/dashboard";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Lead } from "@/types/lead";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM — Lidlar | Adhamjon" };

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6">
          <h1 className="font-display text-xl font-bold">Supabase sozlanmagan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <code>.env.local</code> fayliga <code>NEXT_PUBLIC_SUPABASE_URL</code> va{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ni yozing (README ga qarang).
          </p>
        </div>
      </main>
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  return <Dashboard initialLeads={(data as Lead[]) ?? []} userEmail={user.email ?? ""} loadError={error?.message} />;
}
