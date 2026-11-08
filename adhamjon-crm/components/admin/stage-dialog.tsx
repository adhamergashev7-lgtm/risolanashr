"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAGE_COLORS } from "@/lib/constants";
import { cn, tint } from "@/lib/utils";
import type { Stage } from "@/types/lead";

/** Yangi yacheyka qo'shish yoki mavjudini tahrirlash (nom + rang) */
export function StageDialog({
  open,
  onOpenChange,
  stage,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stage?: Stage | null;
  onSubmit: (v: { name: string; color: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(STAGE_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(stage?.name ?? "");
    setColor(stage?.color ?? STAGE_COLORS[(Math.random() * STAGE_COLORS.length) | 0]);
    setError(null);
  }, [open, stage]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return setError("Yacheyka nomini kiriting");
    if (v.length > 60) return setError("Nom 60 belgidan oshmasin");
    setSaving(true);
    const ok = await onSubmit({ name: v, color });
    setSaving(false);
    if (ok !== null && ok !== false) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="stage-dialog-desc">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{stage ? "Yacheykani tahrirlash" : "Yangi yacheyka"}</DialogTitle>
            <DialogDescription id="stage-dialog-desc">
              {stage ? "Nomi va rangini o'zgartiring." : "Lidlar uchun yangi bosqich (ustun) qo'shing."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Nomi</Label>
              <Input
                id="stage-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Masalan: Nasiya rasmiylashtirildi"
                maxLength={60}
                aria-invalid={!!error}
              />
              {error && <p className="text-xs font-medium text-danger">{error}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Rang</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rang">
                {STAGE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={color === c}
                    aria-label={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition-transform hover:scale-105",
                      color === c && "ring-2 ring-graphite",
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ko&apos;rinishi</p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                style={{ color, backgroundColor: tint(color, 0.1) }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {name.trim() || "Yacheyka nomi"}
              </span>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} {stage ? "Saqlash" : "Qo'shish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
