"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SOURCES, type LeadSource } from "@/lib/constants";
import { isDemoMode } from "@/lib/env";
import { createLocalStore } from "@/lib/store/local-store";
import { flattenErrors, leadFormSchema, type FieldErrors } from "@/lib/validation";
import { PhoneInput } from "./phone-input";

interface FormState {
  full_name: string;
  phone: string;
  product: string;
  comment: string;
  website: string;
}

const INITIAL: FormState = { full_name: "", phone: "+998 ", product: "", comment: "", website: "" };

export function LeadForm() {
  const params = useSearchParams();
  const sourceParam = params.get("manba") ?? params.get("source") ?? "";
  const source: LeadSource = (SOURCES as readonly string[]).includes(sourceParam) ? (sourceParam as LeadSource) : "sayt";

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const payload = { ...form, source };
    const parsed = leadFormSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = flattenErrors(parsed.error);
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) document.getElementById(`field-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      if (isDemoMode()) {
        // Demo: lid shu brauzerdagi CRM ga yoziladi (/admin da ko'rinadi)
        if (!parsed.data.website) {
          const { website: _w, ...v } = parsed.data;
          await createLocalStore().createLead(v);
        }
        setDone(true);
        return;
      }
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: FieldErrors };
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerError(data.error ?? "Xatolik yuz berdi. Qayta urinib ko'ring.");
        return;
      }
      setDone(true);
    } catch {
      setServerError("Internet aloqasini tekshiring va qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="animate-fade-up rounded-3xl bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-qiymat text-white">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2.2} />
        </div>
        <h2 className="font-display text-3xl font-semibold text-qiymat">Rahmat! Tez orada bog&apos;lanamiz</h2>
        <p className="mx-auto mt-3 max-w-sm text-graphite-80">
          Arizangiz qabul qilindi. Menejerimiz <b className="text-graphite">{form.phone}</b> raqamiga qo&apos;ng&apos;iroq qiladi.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="mt-7"
          onClick={() => {
            setForm(INITIAL);
            setDone(false);
          }}
        >
          Yana ariza qoldirish
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative animate-fade-up space-y-5 rounded-3xl bg-white p-5 shadow-xl sm:p-8">
      <Field id="full_name" label="Ismingiz" required error={errors.full_name}>
        <Input
          id="field-full_name"
          name="full_name"
          autoComplete="name"
          placeholder="Masalan: Aziza"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          aria-invalid={!!errors.full_name}
          maxLength={120}
        />
      </Field>

      <Field id="phone" label="Telefon raqamingiz" required error={errors.phone}>
        <PhoneInput
          id="field-phone"
          name="phone"
          value={form.phone}
          onValueChange={(v) => update("phone", v)}
          aria-invalid={!!errors.phone}
          className="text-lg sm:text-base"
        />
      </Field>

      <Field id="product" label="Nima qiziqtiradi?" hint="Ixtiyoriy" error={errors.product}>
        <Input
          id="field-product"
          name="product"
          placeholder="Mahsulot yoki xizmat nomi"
          value={form.product}
          onChange={(e) => update("product", e.target.value)}
          maxLength={200}
        />
      </Field>

      <Field id="comment" label="Izoh" hint="Ixtiyoriy" error={errors.comment}>
        <Textarea
          id="field-comment"
          name="comment"
          placeholder="Savolingiz yoki qulay qo'ng'iroq vaqti"
          value={form.comment}
          onChange={(e) => update("comment", e.target.value)}
          maxLength={1000}
          className="min-h-[96px]"
        />
      </Field>

      {/* Honeypot (botlar uchun) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
      </div>

      {serverError && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full text-base" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="animate-spin" /> Yuborilmoqda...
          </>
        ) : (
          <>
            Ariza yuborish <ArrowRight />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-graphite-80">Ma&apos;lumotlaringiz maxfiy saqlanadi</p>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`field-${id}`}>
        {label}
        {required && <span className="ml-0.5 text-qiymat">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-graphite-80">{hint}</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
