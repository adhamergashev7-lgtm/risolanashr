import type { ActivityType, Lead, LeadActivity, LeadInput, LeadPatch, Stage } from "@/types/lead";

export type ChangeEvent =
  | { table: "leads"; type: "INSERT" | "UPDATE"; row: Lead }
  | { table: "leads"; type: "DELETE"; id: string }
  | { table: "stages"; type: "INSERT" | "UPDATE"; row: Stage }
  | { table: "stages"; type: "DELETE"; id: string }
  /** Hammasini qayta yuklash (masalan, demo rejimda boshqa tabda o'zgarganda) */
  | { table: "all"; type: "RELOAD" };

/** CRM ma'lumotlar qatlami: Supabase (haqiqiy) yoki localStorage (demo) */
export interface CrmStore {
  readonly mode: "supabase" | "demo";
  listStages(): Promise<Stage[]>;
  listLeads(): Promise<Lead[]>;
  createLead(input: LeadInput): Promise<Lead>;
  updateLead(id: string, patch: LeadPatch): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  listActivities(leadId: string): Promise<LeadActivity[]>;
  addActivity(leadId: string, type: ActivityType, message: string | null, meta?: Record<string, unknown>): Promise<LeadActivity>;
  createStage(input: { name: string; color: string }): Promise<Stage>;
  updateStage(id: string, patch: Partial<Pick<Stage, "name" | "color" | "position">>): Promise<Stage>;
  /** Yacheykani o'chiradi, undagi lidlar `moveToId` ga ko'chiriladi */
  deleteStage(id: string, moveToId: string): Promise<void>;
  subscribe(cb: (e: ChangeEvent) => void): () => void;
}
