/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { LeadForm } from "@/components/form/lead-form";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-qiymat">
      {/* Emblemaning chorak-aylana motivi */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border-[70px] border-sage/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-56 -left-48 h-[560px] w-[560px] rounded-full border-[80px] border-white/[0.06]" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-16 lg:pt-20">
        <section className="animate-fade-up text-white">
          <div className="mb-10 inline-flex items-center rounded-2xl bg-white px-4 py-2.5">
            <img src="/qiymat-logo.svg" alt={BRAND.name} className="h-9 w-auto" width={94} height={36} />
          </div>
          <p className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-sage-60">Ariza qoldiring</p>
          <h1 className="font-display text-[2.4rem] font-semibold leading-[1.05] sm:text-6xl">
            Bepul konsultatsiya uchun <span className="text-sage">ariza qoldiring</span>
          </h1>
          <p className="mt-5 flex items-center gap-2 text-lg text-sage-60">
            <Clock3 className="h-5 w-5 shrink-0 text-sage" />
            Menejerimiz tez orada siz bilan bog&apos;lanadi
          </p>
          <ul className="mt-8 hidden gap-4 text-sm text-sage-60 lg:grid">
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sage" /> {BRAND.tagline}
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sage" /> Ma&apos;lumotlar uchinchi shaxslarga berilmaydi
            </li>
          </ul>
        </section>

        <Suspense>
          <LeadForm />
        </Suspense>
      </div>

      <footer className="relative pb-8 text-center text-xs text-sage-60">
        © {new Date().getFullYear()} {BRAND.name} — {BRAND.tagline}
      </footer>
    </main>
  );
}
