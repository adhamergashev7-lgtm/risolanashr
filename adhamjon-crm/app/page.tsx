import { CheckCircle2, Clock3, Instagram, TrendingUp } from "lucide-react";
import { LeadForm } from "@/components/form/lead-form";

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fon effektlari */}
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-lime/10 blur-[120px]" />

      <div className="relative mx-auto flex w-full max-w-xl flex-col px-4 pb-16 pt-8 sm:pt-14">
        <header className="mb-8 flex items-center justify-between">
          <a
            href="https://instagram.com/marketolog_adhamjon"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-4 text-sm font-semibold backdrop-blur transition-colors hover:border-primary/40"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Instagram className="h-4 w-4" />
            </span>
            @marketolog_adhamjon
          </a>
          <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Ariza qabul qilinmoqda
          </span>
        </header>

        <section className="mb-8 animate-fade-up">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-lime-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <TrendingUp className="h-3.5 w-3.5" /> Bepul tahlil
          </span>
          <h1 className="font-display text-[2.15rem] font-extrabold leading-[1.08] sm:text-5xl">
            Bepul marketing tahlili uchun <span className="text-primary">ariza qoldiring</span>
          </h1>
          <p className="mt-4 flex items-center gap-2 text-base text-muted-foreground sm:text-lg">
            <Clock3 className="h-5 w-5 shrink-0 text-primary" />
            24 soat ichida menejer bog&apos;lanadi
          </p>
        </section>

        <LeadForm />

        <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          {["Bepul va majburiyatsiz", "Biznesingizga mos strategiya", "Ma'lumotlar maxfiy"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {t}
            </li>
          ))}
        </ul>

        <footer className="mt-12 text-center text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Marketolog Adhamjon
        </footer>
      </div>
    </main>
  );
}
