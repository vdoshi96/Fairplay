import { Suspense } from "react";

import { ChoosePersonaClient } from "@/components/auth/choose-persona-client";

export default function ChoosePersonaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-fp-paper px-4 py-6 text-fp-ink">
          <p className="text-[15px] leading-6 text-fp-muted-ink">
            Loading persona selection...
          </p>
        </main>
      }
    >
      <ChoosePersonaClient />
    </Suspense>
  );
}
