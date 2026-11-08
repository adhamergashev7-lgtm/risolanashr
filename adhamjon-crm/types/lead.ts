import type { StageKey } from "@/lib/constants";

export interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
  key: StageKey | null;
  is_default: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  product: string | null;
  source: string;
  comment: string | null;
  amount: number | null;
  stage_id: string;
  reminder_at: string | null;
  viewed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export type LeadInput = Pick<Lead, "full_name" | "phone" | "product" | "source" | "comment"> &
  Partial<Pick<Lead, "amount" | "stage_id" | "reminder_at">>;

export type LeadPatch = Partial<
  Pick<Lead, "full_name" | "phone" | "product" | "source" | "comment" | "amount" | "stage_id" | "reminder_at" | "viewed_at">
>;

export type ActivityType = "created" | "viewed" | "stage_changed" | "note" | "call" | "reminder" | "telegram_sent" | "edited";

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  message: string | null;
  meta: Record<string, unknown> | null;
  author_email: string | null;
  created_at: string;
}
