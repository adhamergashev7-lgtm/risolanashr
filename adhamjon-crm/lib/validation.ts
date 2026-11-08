import { z } from "zod";
import { PHONE_REGEX, SOURCES } from "./constants";

const optionalText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const leadFormSchema = z.object({
  full_name: z
    .string({ required_error: "Ismni kiriting" })
    .trim()
    .min(2, "Ismni kiriting (kamida 2 harf)")
    .max(120, "Ism juda uzun"),
  phone: z
    .string({ required_error: "Telefon raqamini kiriting" })
    .trim()
    .regex(PHONE_REGEX, "Telefon raqamini to'liq kiriting: +998 XX XXX XX XX"),
  product: optionalText(200, "200 belgidan oshmasin"),
  comment: optionalText(1000, "Izoh 1000 belgidan oshmasin"),
  source: z.enum(SOURCES).catch("sayt"),
  /** Honeypot — botlar to'ldiradi, odamlar ko'rmaydi */
  website: z.string().optional(),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;

export type FieldErrors = Partial<Record<keyof LeadFormInput | "amount", string>>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof FieldErrors | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
