import type { BusinessType, LeadStatus, MonthlyBudget, Problem } from "@/lib/constants";

export interface Lead {
  id: string;
  full_name: string;
  phone: string;
  business_type: BusinessType;
  monthly_budget: MonthlyBudget;
  problems: Problem[];
  comment: string | null;
  score: number;
  status: LeadStatus;
  source: string;
  meeting_at: string | null;
  viewed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export type ActivityType = "created" | "viewed" | "status_changed" | "note" | "call" | "meeting" | "telegram_sent";

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  message: string | null;
  meta: Record<string, unknown> | null;
  author_email: string | null;
  created_at: string;
}
