"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border !border-border !bg-card !text-foreground !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
