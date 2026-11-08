"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border !border-border !bg-white !text-foreground !font-sans !shadow-lg",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
