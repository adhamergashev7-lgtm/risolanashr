/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/** Qiymat emblemasi (brendbukdagi vektor) + yozuv */
export function BrandMark({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", light ? "bg-white" : "bg-white ring-1 ring-border")}>
        <img src="/qiymat-emblem.svg" alt="" className="h-7 w-7" width={28} height={28} />
      </span>
      <span className="leading-tight">
        <span className={cn("block font-display text-base font-semibold", light ? "text-white" : "text-qiymat")}>Qiymat CRM</span>
        <span className={cn("block text-xs", light ? "text-sage-60" : "text-graphite-80")}>Lidlar boshqaruvi</span>
      </span>
    </span>
  );
}
