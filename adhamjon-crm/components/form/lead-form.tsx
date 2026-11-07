"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Instagram, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGETS,
  BUDGET_LABELS,
  BUSINESS_TYPES,
  PROBLEMS,
  PROBLEM_LABELS,
  type BusinessType,
  type MonthlyBudget,
  type Problem,
} from "@/lib/constants";
import { formatUzPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { flattenErrors, leadFormSchema, type FieldErrors } from "@/lib/validation";

interface FormState {
  full_name: string;
  phone: string;
  business_type: BusinessType | "";
  monthly_budget: MonthlyBudget | "";
  problems: Problem[];
  comment: string;
  website: string;
}

const INITIAL: FormState = {
  full_name: "",
  phone: "+998 ",
  business_type: "",
  monthly_budget: "",
  problems: [],
  comment: "",
  website: "",
};

export function LeadForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleProblem(p: Problem, checked: boolean) {
    update("problems", checked ? [...form.problems, p] : form.problems.filter((x) => x !== p));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const payload = {
      ...form,
      business_type: form.business_type || undefined,
      monthly_budget: form.monthly_budget || undefined,
    };
    const parsed = leadFormSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = flattenErrors(parsed.error);
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Internet aloqasini tekshiring va qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="animate-fade-up rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-glow sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2.5} />
        </div>
        <h2 className="font-display text-3xl font-extrabold">Rahmat! Tez orada bog&apos;lanamiz</h2>
        <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
          Arizangiz qabul qilindi. Menejerimiz 24 soat ichida <b className="text-foreground">{form.phone}</b> raqamiga
          qo&apos;ng&apos;iroq qiladi.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <a href="https://instagram.com/marketolog_adhamjon" target="_blank" rel="noopener noreferrer">
              <Instagram /> Instagramga qaytish
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setForm(INITIAL);
              setDone(false);
            }}
          >
            Yangi ariza
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative animate-fade-up space-y-6 rounded-3xl border border-border bg-card/90 p-5 backdrop-blur sm:p-8"
    >
      {/* Ism */}
      <Field id="full_name" label="Ismingiz" required error={errors.full_name}>
        <Input
          id="field-full_name"
          name="full_name"
          autoComplete="name"
          placeholder="Masalan: Bilol"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          aria-invalid={!!errors.full_name}
          maxLength={120}
        />
      </Field>

      {/* Telefon */}
      <Field id="phone" label="Telefon raqamingiz" required error={errors.phone}>
        <Input
          id="field-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+998 90 123 45 67"
          value={form.phone}
          onChange={(e) => update("phone", formatUzPhone(e.target.value))}
          onFocus={(e) => {
            // kursorni oxiriga qo'yamiz — "+998 " prefiksi oldiga yozilib qolmasin
            const el = e.currentTarget;
            requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
          }}
          aria-invalid={!!errors.phone}
          className="tabular text-lg tracking-wide sm:text-base"
        />
      </Field>

      {/* Biznes turi */}
      <Field id="business_type" label="Biznes turi" required error={errors.business_type}>
        <Select value={form.business_type} onValueChange={(v) => update("business_type", v as BusinessType)}>
          <SelectTrigger id="field-business_type" aria-invalid={!!errors.business_type}>
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Byudjet */}
      <Field id="monthly_budget" label="Oylik marketing byudjeti" required error={errors.monthly_budget} asGroup>
        <RadioGroup
          id="field-monthly_budget"
          value={form.monthly_budget}
          onValueChange={(v) => update("monthly_budget", v as MonthlyBudget)}
          className="grid-cols-1 sm:grid-cols-2"
          aria-label="Oylik marketing byudjeti"
        >
          {BUDGETS.map((b) => (
            <label
              key={b}
              htmlFor={`budget-${b}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3.5 text-sm font-medium transition-colors hover:border-muted-foreground/40",
                form.monthly_budget === b && "border-primary/70 bg-lime-soft",
              )}
            >
              <RadioGroupItem id={`budget-${b}`} value={b} />
              {BUDGET_LABELS[b]}
            </label>
          ))}
        </RadioGroup>
      </Field>

      {/* Muammolar */}
      <Field id="problems" label="Muammoingiz nima?" required error={errors.problems} hint="Bir nechtasini tanlash mumkin" asGroup>
        <div id="field-problems" className="grid gap-2" role="group" aria-label="Muammoingiz nima?">
          {PROBLEMS.map((p) => {
            const checked = form.problems.includes(p);
            return (
              <label
                key={p}
                htmlFor={`problem-${p}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-4 py-3.5 transition-colors hover:border-muted-foreground/40",
                  checked && "border-primary/70 bg-lime-soft",
                )}
              >
                <Checkbox id={`problem-${p}`} checked={checked} onCheckedChange={(c) => toggleProblem(p, c === true)} />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{PROBLEM_LABELS[p].title}</span>
                  <span className="text-xs text-muted-foreground">{PROBLEM_LABELS[p].hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </Field>

      {/* Izoh */}
      <Field id="comment" label="Biznesingiz haqida qisqacha" error={errors.comment} hint="Ixtiyoriy">
        <Textarea
          id="field-comment"
          name="comment"
          placeholder="Nima sotasiz, qayerdasiz, hozir qanday reklama qilyapsiz..."
          value={form.comment}
          onChange={(e) => update("comment", e.target.value)}
          maxLength={1000}
        />
      </Field>

      {/* Honeypot (botlar uchun) */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
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
    </form>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  asGroup,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  asGroup?: boolean;
  children: React.ReactNode;
}) {
  const labelContent = (
    <>
      {label}
      {required && <span className="ml-0.5 text-primary">*</span>}
      {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
    </>
  );
  return (
    <div className="space-y-2.5">
      {asGroup ? (
        <p className="text-sm font-semibold leading-none">{labelContent}</p>
      ) : (
        <Label htmlFor={`field-${id}`}>{labelContent}</Label>
      )}
      {children}
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
