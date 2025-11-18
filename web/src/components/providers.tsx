'use client'

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      appearance={{
        layout: {
          logoPlacement: "inside",
        },
        elements: {
          card: "shadow-xl border-border",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
