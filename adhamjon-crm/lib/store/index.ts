"use client";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createLocalStore } from "./local-store";
import { createSupabaseStore } from "./supabase-store";
import type { CrmStore } from "./types";

export type { CrmStore, ChangeEvent } from "./types";

export function getCrmStore(userEmail: string): CrmStore {
  return isSupabaseConfigured() ? createSupabaseStore(getSupabaseBrowserClient(), userEmail) : createLocalStore();
}
