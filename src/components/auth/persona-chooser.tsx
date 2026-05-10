"use client";

import { useState } from "react";

import type { PersonaSummary } from "@/contracts/personas";
import { readApiError } from "./form-utils";

type PersonaChooserProps = {
  activePersonaId: string | null;
  personas: PersonaSummary[];
  onSelected: (persona: PersonaSummary) => void;
};

const personaAccent: Record<"alex" | "max", string> = {
  alex: "border-fp-alex",
  max: "border-fp-max"
};

export function PersonaChooser({
  activePersonaId,
  onSelected,
  personas
}: PersonaChooserProps) {
  const [pendingPersonaId, setPendingPersonaId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const householdPersonas = personas.filter(
    (persona) => persona.key === "alex" || persona.key === "max"
  );

  async function choosePersona(persona: PersonaSummary) {
    setPendingPersonaId(persona.id);
    setError(null);

    try {
      const response = await fetch("/api/personas/select", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          personaId: persona.id
        })
      });

      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }

      onSelected(persona);
    } catch {
      setError("Unable to select a persona right now. Please try again.");
    } finally {
      setPendingPersonaId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {error ? (
        <p
          className="rounded-[8px] border border-fp-danger/40 bg-[var(--fp-card)] px-3 py-2 text-[14px] leading-5 text-fp-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {householdPersonas.map((persona) => {
          const selected = persona.id === activePersonaId;
          const pending = pendingPersonaId === persona.id;

          return (
            <button
              aria-pressed={selected}
              className={`min-h-[112px] rounded-[8px] border-2 bg-[var(--fp-card)] p-4 text-left shadow-[var(--fp-shadow-soft)] outline-none transition hover:-translate-y-0.5 hover:bg-[var(--fp-surface)] focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-70 ${
                personaAccent[persona.key]
              }`}
              disabled={pendingPersonaId !== null}
              key={persona.id}
              onClick={() => void choosePersona(persona)}
              type="button"
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-11 w-11 place-items-center rounded-full text-[16px] font-bold text-fp-on-primary ${
                    persona.key === "alex" ? "bg-fp-alex" : "bg-fp-max"
                  }`}
                >
                  {persona.displayName.slice(0, 1)}
                </span>
                <span>
                  <span className="block text-[17px] font-bold text-fp-ink">
                    {persona.displayName}
                  </span>
                  <span className="block text-[13px] font-medium text-fp-muted-ink">
                    {selected ? "Active persona" : "Use this view"}
                  </span>
                </span>
              </span>
              <span className="mt-4 block text-[14px] font-semibold text-fp-ink">
                {pending ? `Choosing ${persona.displayName}...` : `Choose ${persona.displayName}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
