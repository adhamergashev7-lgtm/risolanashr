"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getCrmStore, type ChangeEvent } from "@/lib/store";
import type { Lead, LeadInput, LeadPatch, Stage } from "@/types/lead";

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Noma'lum xato");

/** Yacheykalar tartibi: pozitsiya bo'yicha, "O'chirilgan" doim oxirida */
export function sortStages(list: Stage[]) {
  return [...list].sort((a, b) => Number(a.key === "deleted") - Number(b.key === "deleted") || a.position - b.position);
}

/** CRM holati va amallari (optimistik yangilash + realtime) */
export function useCrm(userEmail: string) {
  const store = useMemo(() => getCrmStore(userEmail), [userEmail]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([store.listStages(), store.listLeads()]);
      setStages(sortStages(s));
      setLeads(l);
    } catch (e) {
      toast.error("Ma'lumotlarni yuklab bo'lmadi", { description: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    return store.subscribe((e: ChangeEvent) => {
      if (e.table === "all") return void reload();
      if (e.table === "leads") {
        if (e.type === "DELETE") setLeads((ls) => ls.filter((l) => l.id !== e.id));
        else
          setLeads((ls) => {
            const exists = ls.some((l) => l.id === e.row.id);
            if (e.type === "INSERT" && !exists) {
              if (store.mode === "supabase") toast.success(`Yangi lid: ${e.row.full_name}`);
              return [e.row, ...ls];
            }
            return ls.map((l) => (l.id === e.row.id ? { ...l, ...e.row } : l));
          });
      } else {
        if (e.type === "DELETE") setStages((ss) => ss.filter((s) => s.id !== e.id));
        else
          setStages((ss) => sortStages(ss.some((s) => s.id === e.row.id) ? ss.map((s) => (s.id === e.row.id ? e.row : s)) : [...ss, e.row]));
      }
    });
  }, [store, reload]);

  const stageByKey = useCallback((key: string) => stages.find((s) => s.key === key), [stages]);
  const defaultStage = useMemo(
    () => [...stages].sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.position - b.position)[0],
    [stages],
  );

  const createLead = useCallback(
    async (input: LeadInput) => {
      try {
        const lead = await store.createLead(input);
        setLeads((ls) => (ls.some((l) => l.id === lead.id) ? ls : [lead, ...ls]));
        toast.success("Lid qo'shildi", { description: lead.full_name });
        return lead;
      } catch (e) {
        toast.error("Lid qo'shib bo'lmadi", { description: errMsg(e) });
        return null;
      }
    },
    [store],
  );

  const updateLead = useCallback(
    async (lead: Lead, patch: LeadPatch, opts: { silent?: boolean; success?: string } = {}) => {
      setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, ...patch } : l)));
      try {
        const saved = await store.updateLead(lead.id, patch);
        setLeads((ls) => ls.map((l) => (l.id === lead.id ? saved : l)));
        if (opts.success) toast.success(opts.success, { description: lead.full_name });
        return saved;
      } catch (e) {
        setLeads((ls) => ls.map((l) => (l.id === lead.id ? lead : l)));
        if (!opts.silent) toast.error("O'zgartirib bo'lmadi", { description: errMsg(e) });
        return null;
      }
    },
    [store],
  );

  const moveLead = useCallback(
    async (lead: Lead, stageId: string) => {
      if (lead.stage_id === stageId) return null;
      const stage = stages.find((s) => s.id === stageId);
      return updateLead(lead, { stage_id: stageId }, { success: `→ ${stage?.name ?? "Yacheyka"}` });
    },
    [stages, updateLead],
  );

  /** "O'chirish" — lid "O'chirilgan" yacheykasiga ko'chadi (qayta tiklash mumkin) */
  const archiveLead = useCallback(
    async (lead: Lead) => {
      const deleted = stageByKey("deleted");
      if (!deleted) return null;
      return updateLead(lead, { stage_id: deleted.id }, { success: "O'chirilganlarga ko'chirildi" });
    },
    [stageByKey, updateLead],
  );

  const restoreLead = useCallback(
    async (lead: Lead) => (defaultStage ? updateLead(lead, { stage_id: defaultStage.id }, { success: "Qayta tiklandi" }) : null),
    [defaultStage, updateLead],
  );

  const destroyLead = useCallback(
    async (lead: Lead) => {
      const snapshot = leads;
      setLeads((ls) => ls.filter((l) => l.id !== lead.id));
      try {
        await store.deleteLead(lead.id);
        toast.success("Lid butunlay o'chirildi", { description: lead.full_name });
      } catch (e) {
        setLeads(snapshot);
        toast.error("O'chirib bo'lmadi", { description: errMsg(e) });
      }
    },
    [leads, store],
  );

  const createStage = useCallback(
    async (input: { name: string; color: string }) => {
      try {
        const stage = await store.createStage(input);
        setStages((ss) => sortStages(ss.some((s) => s.id === stage.id) ? ss : [...ss, stage]));
        toast.success("Yacheyka qo'shildi", { description: stage.name });
        return stage;
      } catch (e) {
        toast.error("Yacheyka qo'shib bo'lmadi", { description: errMsg(e) });
        return null;
      }
    },
    [store],
  );

  const updateStage = useCallback(
    async (stage: Stage, patch: Partial<Pick<Stage, "name" | "color">>) => {
      setStages((ss) => ss.map((s) => (s.id === stage.id ? { ...s, ...patch } : s)));
      try {
        await store.updateStage(stage.id, patch);
        return true;
      } catch (e) {
        setStages((ss) => ss.map((s) => (s.id === stage.id ? stage : s)));
        toast.error("Saqlab bo'lmadi", { description: errMsg(e) });
        return false;
      }
    },
    [store],
  );

  /** Yacheykani chapga/o'ngga surish ("O'chirilgan" doim oxirida qoladi) */
  const moveStage = useCallback(
    async (stage: Stage, dir: -1 | 1) => {
      const ordered = sortStages(stages).filter((s) => s.key !== "deleted");
      const i = ordered.findIndex((s) => s.id === stage.id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= ordered.length) return;
      // Tartibni 0..n qilib qayta raqamlaymiz — takroriy pozitsiyalar muammo bo'lmaydi
      const swapped = [...ordered];
      [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
      const changes = swapped.map((s, idx) => ({ s, position: idx })).filter(({ s, position }) => s.position !== position);
      const previous = stages;
      setStages((ss) => sortStages(ss.map((s) => ({ ...s, position: changes.find((c) => c.s.id === s.id)?.position ?? s.position }))));
      try {
        await Promise.all(changes.map(({ s, position }) => store.updateStage(s.id, { position })));
      } catch (e) {
        setStages(previous);
        toast.error("Tartibni o'zgartirib bo'lmadi", { description: errMsg(e) });
      }
    },
    [stages, store],
  );

  const deleteStage = useCallback(
    async (stage: Stage, moveTo: Stage) => {
      try {
        await store.deleteStage(stage.id, moveTo.id);
        setLeads((ls) => ls.map((l) => (l.stage_id === stage.id ? { ...l, stage_id: moveTo.id } : l)));
        setStages((ss) => ss.filter((s) => s.id !== stage.id));
        toast.success("Yacheyka o'chirildi", { description: `Lidlar → ${moveTo.name}` });
      } catch (e) {
        toast.error("Yacheykani o'chirib bo'lmadi", { description: errMsg(e) });
      }
    },
    [store],
  );

  return {
    store,
    stages,
    leads,
    loading,
    defaultStage,
    stageByKey,
    createLead,
    updateLead,
    moveLead,
    archiveLead,
    restoreLead,
    destroyLead,
    createStage,
    updateStage,
    moveStage,
    deleteStage,
  };
}

export type Crm = ReturnType<typeof useCrm>;
