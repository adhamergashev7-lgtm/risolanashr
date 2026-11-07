import { z } from "zod";
import { BUDGETS, BUSINESS_TYPES, PHONE_REGEX, PROBLEMS } from "./constants";

export const leadFormSchema = z.object({
  full_name: z
    .string({ required_error: "Ismingizni kiriting" })
    .trim()
    .min(2, "Ismingizni kiriting (kamida 2 harf)")
    .max(120, "Ism juda uzun"),
  phone: z
    .string({ required_error: "Telefon raqamini kiriting" })
    .trim()
    .regex(PHONE_REGEX, "Telefon raqamini to'liq kiriting: +998 XX XXX XX XX"),
  business_type: z.enum(BUSINESS_TYPES, {
    errorMap: () => ({ message: "Biznes turini tanlang" }),
  }),
  monthly_budget: z.enum(BUDGETS, {
    errorMap: () => ({ message: "Oylik byudjetni tanlang" }),
  }),
  problems: z
    .array(z.enum(PROBLEMS), { invalid_type_error: "Muammoni tanlang" })
    .min(1, "Kamida bitta muammoni belgilang")
    .transform((arr) => Array.from(new Set(arr))),
  comment: z
    .string()
    .trim()
    .max(1000, "Izoh 1000 belgidan oshmasin")
    .optional()
    .transform((v) => (v ? v : null)),
  /** Honeypot — botlar to'ldiradi, odamlar ko'rmaydi */
  website: z.string().optional(),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;

export type FieldErrors = Partial<Record<keyof LeadFormInput, string>>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof LeadFormInput | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
