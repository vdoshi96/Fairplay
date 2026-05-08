"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import { AuthPageShell } from "./auth-page-shell";
import { PersonaChooser } from "./persona-chooser";

type MeResponse = {
  authenticated?: boolean;
  household?: HouseholdSummary;
  personas?: PersonaSummary[];
  selectedPersonaId?: string | null;
};

export function ChoosePersonaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [household, setHousehold] = useState<HouseholdSummary | null>(null);
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const nextPath = useMemo(() => {
    const rawNext = searchParams.get("next") || "/app/distribute";
    return rawNext.startsWith("/app/") ? rawNext : "/app/distribute";
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store"
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("session");
        }

        const body = (await response.json()) as MeResponse;
        if (!active) {
          return;
        }

        setHousehold(body.household ?? null);
        setPersonas(body.personas ?? []);
        setActivePersonaId(body.selectedPersonaId ?? null);
      } catch {
        if (active) {
          setError("Unable to load personas right now. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <AuthPageShell
      eyebrow={household?.name ?? "Persona selection"}
      footer="You can switch persona later from Settings after a confirmation."
      summary="Pick the view you are using now. The shared household stays the same."
      title="Choose Alex or Max"
    >
      {loading ? (
        <p className="text-[15px] leading-6 text-fp-muted-ink">Loading personas...</p>
      ) : error ? (
        <p
          className="rounded-[8px] border border-fp-danger/40 bg-white px-3 py-2 text-[14px] leading-5 text-fp-danger"
          role="alert"
        >
          {error}
        </p>
      ) : (
        <PersonaChooser
          activePersonaId={activePersonaId}
          onSelected={() => {
            router.push(nextPath);
          }}
          personas={personas}
        />
      )}
    </AuthPageShell>
  );
}
