"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PhoneInput } from "@/components/form/phone-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SOURCES, SOURCE_LABELS, type LeadSource } from "@/lib/constants";
import { toLocalInput } from "@/lib/utils";
import { flattenErrors, leadFormSchema, type FieldErrors } from "@/lib/validation";
import type { Lead, LeadInput, Stage } from "@/types/lead";
import { StageDot } from "./stage-pill";

interface FormState {
  full_name: string;
  phone: string;
  product: string;
  source: LeadSource;
  stage_id: string;
  amount: string;
  reminder_at: string;
  comment: string;
}

/** Yangi lid qo'shish / lidni tahrirlash */
export function LeadDialog({
  open,
  onOpenChange,
  lead,
  stages,
  defaultStageId,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  stages: Stage[];
  defaultStageId?: string;
  onSubmit: (input: LeadInput) => Promise<unknown>;
}) {
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({
      full_name: lead?.full_name ?? "",
      phone: lead?.phone ?? "+998 ",
      product: lead?.product ?? "",
      source: (lead?.source as LeadSource) ?? "qongiroq",
      stage_id: lead?.stage_id ?? defaultStageId ?? stages[0]?.id ?? "",
      amount: lead?.amount != null ? String(lead.amount) : "",
      reminder_at: toLocalInput(lead?.reminder_at),
      comment: lead?.comment ?? "",
    });
  }, [open, lead, defaultStageId, stages]);

  if (!form) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    if (errors[k as keyof FieldErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const parsed = leadFormSchema.safeParse(form);
    const errs: FieldErrors = parsed.success ? {} : flattenErrors(parsed.error);
    const amountDigits = form.amount.replace(/\s/g, "");
    if (amountDigits && !/^\d{1,14}$/.test(amountDigits)) errs.amount = "Faqat raqam kiriting";
    if (!parsed.success || errs.amount) return setErrors(errs);

    setSaving(true);
    const ok = await onSubmit({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      product: parsed.data.product,
      comment: parsed.data.comment,
      source: form.source,
      stage_id: form.stage_id || undefined,
      amount: amountDigits ? Number(amountDigits) : null,
      reminder_at: form.reminder_at ? new Date(form.reminder_at).toISOString() : null,
    });
    setSaving(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="lead-dialog-desc">
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{lead ? "Lidni tahrirlash" : "Yangi lid qo'shish"}</DialogTitle>
            <DialogDescription id="lead-dialog-desc">
              {lead ? lead.full_name : "Qo'ng'iroq, do'kon yoki boshqa manbadan kelgan mijozni kiriting."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Ism" required error={errors.full_name} htmlFor="ld-name" className="sm:col-span-2">
              <Input
                id="ld-name"
                autoFocus={!lead}
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Mijoz ismi"
                aria-invalid={!!errors.full_name}
                maxLength={120}
              />
            </Field>
            <Field label="Telefon" required error={errors.phone} htmlFor="ld-phone">
              <PhoneInput id="ld-phone" value={form.phone} onValueChange={(v) => set("phone", v)} aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Qiziqish / mahsulot" error={errors.product} htmlFor="ld-product">
              <Input
                id="ld-product"
                value={form.product}
                onChange={(e) => set("product", e.target.value)}
                placeholder="Masalan: Muzlatgich"
                maxLength={200}
              />
            </Field>
            <Field label="Manba" htmlFor="ld-source">
              <Select value={form.source} onValueChange={(v) => set("source", v as LeadSource)}>
                <SelectTrigger id="ld-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Yacheyka" htmlFor="ld-stage">
              <Select value={form.stage_id} onValueChange={(v) => set("stage_id", v)}>
                <SelectTrigger id="ld-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <StageDot color={s.color} /> {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Summa (so'm)" error={errors.amount} htmlFor="ld-amount">
              <Input
                id="ld-amount"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="Masalan: 4500000"
                aria-invalid={!!errors.amount}
              />
            </Field>
            <Field label="Eslatma (qayta qo'ng'iroq)" htmlFor="ld-reminder">
              <Input id="ld-reminder" type="datetime-local" value={form.reminder_at} onChange={(e) => set("reminder_at", e.target.value)} />
            </Field>
            <Field label="Izoh" error={errors.comment} htmlFor="ld-comment" className="sm:col-span-2">
              <Textarea
                id="ld-comment"
                value={form.comment}
                onChange={(e) => set("comment", e.target.value)}
                placeholder="Mijoz haqida qo'shimcha ma'lumot"
                className="min-h-[88px]"
                maxLength={1000}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {lead ? "Saqlash" : "Lidni qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-2 block">
        {label}
        {required && <span className="ml-0.5 text-qiymat">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
