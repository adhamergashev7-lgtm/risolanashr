/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Kirish — Qiymat CRM" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-qiymat px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full border-[64px] border-sage/20" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white px-5 py-3">
            <img src="/qiymat-logo.svg" alt="Qiymat agency" className="h-10 w-auto" width={104} height={40} />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold text-white">Qiymat CRM</h1>
          <p className="mt-1 text-sm text-sage-60">Faqat admin va menejerlar uchun</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
