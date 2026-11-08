"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadActivity, Stage } from "@/types/lead";
import type { ChangeEvent, CrmStore } from "./types";

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function createSupabaseStore(supabase: SupabaseClient, userEmail: string): CrmStore {
  return {
    mode: "supabase",

    async listStages() {
      return check(await supabase.from("stages").select("*").order("position").order("created_at")) as Stage[];
    },
    async listLeads() {
      return check(await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5000)) as Lead[];
    },
    async createLead(input) {
      return check(
        await supabase
          .from("leads")
          .insert({ ...input, created_by: userEmail || null })
          .select()
          .single(),
      ) as Lead;
    },
    async updateLead(id, patch) {
      return check(await supabase.from("leads").update(patch).eq("id", id).select().single()) as Lead;
    },
    async deleteLead(id) {
      check(await supabase.from("leads").delete().eq("id", id));
    },
    async listActivities(leadId) {
      return check(
        await supabase.from("lead_activities").select("*").eq("lead_id", leadId).order("created_at", { ascending: true }),
      ) as LeadActivity[];
    },
    async addActivity(leadId, type, message, meta) {
      return check(
        await supabase
          .from("lead_activities")
          .insert({ lead_id: leadId, type, message, meta: meta ?? null, author_email: userEmail || null })
          .select()
          .single(),
      ) as LeadActivity;
    },
    async createStage({ name, color }) {
      const stages = check(await supabase.from("stages").select("position").order("position", { ascending: false }).limit(1)) as {
        position: number;
      }[];
      const position = (stages[0]?.position ?? -1) + 1;
      return check(await supabase.from("stages").insert({ name, color, position }).select().single()) as Stage;
    },
    async updateStage(id, patch) {
      return check(await supabase.from("stages").update(patch).eq("id", id).select().single()) as Stage;
    },
    async deleteStage(id, moveToId) {
      check(await supabase.from("leads").update({ stage_id: moveToId }).eq("stage_id", id));
      check(await supabase.from("stages").delete().eq("id", id));
    },
    subscribe(cb) {
      const channel = supabase
        .channel("crm-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (p) => {
          if (p.eventType === "DELETE") {
            const id = (p.old as Partial<Lead>).id;
            if (id) cb({ table: "leads", type: "DELETE", id });
          } else cb({ table: "leads", type: p.eventType, row: p.new as Lead } as ChangeEvent);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "stages" }, (p) => {
          if (p.eventType === "DELETE") {
            const id = (p.old as Partial<Stage>).id;
            if (id) cb({ table: "stages", type: "DELETE", id });
          } else cb({ table: "stages", type: p.eventType, row: p.new as Stage } as ChangeEvent);
        })
        .subscribe();
      return () => {
        void supabase.removeChannel(channel);
      };
    },
  };
}
