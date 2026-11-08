import { redirect } from "next/navigation";
import { Dashboard } from "@/components/admin/dashboard";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lidlar — Qiymat CRM" };

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <Dashboard userEmail="demo@qiymat.uz" />;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  return <Dashboard userEmail={user.email ?? ""} />;
}
