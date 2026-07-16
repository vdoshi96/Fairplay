"use client";

import { useEffect, useMemo, useState } from "react";

import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilityAssignmentSummary } from "@/contracts/responsibilities";
import type { AssignmentRole, AssignmentScope, PersonaKey } from "@/domain/enums";
import { Button } from "@/components/ui/button";

const roleOptions = [
  "none",
  "accountable_owner",
  "shared_owner",
  "helper",
  "backup"
] as const;

const scopeByRole: Record<Exclude<(typeof roleOptions)[number], "none">, AssignmentScope> = {
  accountable_owner: "outcome",
  shared_owner: "outcome",
  helper: "support",
  backup: "temporary"
};

type OwnershipRole = (typeof roleOptions)[number];

export type OwnershipAgreementSubmission = {
  assignments: ResponsibilityAssignmentSummary[];
  expectedUpdatedAt: string;
  expectedOwnerPersonaKeys: PersonaKey[];
  handoffMode:
    | "replace_former_owner"
    | "retain_former_owner_as_helper"
    | null;
  handoffNotes: string | null;
  reviewAt: string | null;
};

type OwnershipDetailsProps = {
  currentAssignments: readonly ResponsibilityAssignmentSummary[];
  expectedUpdatedAt: string;
  nextReviewAt: string | null;
  onSave?: (agreement: OwnershipAgreementSubmission) => Promise<void> | void;
  personas: readonly PersonaSummary[];
};

function currentRole(
  assignments: readonly ResponsibilityAssignmentSummary[],
  personaKey: PersonaKey
): OwnershipRole {
  return assignments.find((assignment) => assignment.personaKey === personaKey)?.role ?? "none";
}

function isOwner(role: AssignmentRole) {
  return role === "accountable_owner" || role === "shared_owner";
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function OwnershipDetails({
  currentAssignments,
  expectedUpdatedAt,
  nextReviewAt,
  onSave,
  personas
}: OwnershipDetailsProps) {
  const [roles, setRoles] = useState<Record<PersonaKey, OwnershipRole>>(() => ({
    alex: currentRole(currentAssignments, "alex"),
    max: currentRole(currentAssignments, "max")
  }));
  const [reviewDate, setReviewDate] = useState(nextReviewAt?.slice(0, 10) ?? "");
  const [handoffMode, setHandoffMode] = useState<
    OwnershipAgreementSubmission["handoffMode"]
  >(null);
  const [handoffNotes, setHandoffNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<
    { message: string; tone: "error" | "success" } | null
  >(null);

  useEffect(() => {
    setRoles({
      alex: currentRole(currentAssignments, "alex"),
      max: currentRole(currentAssignments, "max")
    });
    setReviewDate(nextReviewAt?.slice(0, 10) ?? "");
    setHandoffMode(null);
    setHandoffNotes("");
  }, [currentAssignments, expectedUpdatedAt, nextReviewAt]);

  const assignments = useMemo(
    () =>
      personas.flatMap((persona) => {
        const role = roles[persona.key];
        if (role === "none") {
          return [];
        }

        return [
          {
            personaKey: persona.key,
            role,
            scope: scopeByRole[role]
          }
        ];
      }),
    [personas, roles]
  );
  const currentOwnerKeys = new Set(
    currentAssignments
      .filter((assignment) => isOwner(assignment.role))
      .map((assignment) => assignment.personaKey)
  );
  const nextOwnerKeys = new Set(
    assignments
      .filter((assignment) => isOwner(assignment.role))
      .map((assignment) => assignment.personaKey)
  );
  const removesCurrentOwner = [...currentOwnerKeys].some(
    (personaKey) => !nextOwnerKeys.has(personaKey)
  );

  async function save() {
    setFeedback(null);

    const ownerCount = assignments.filter((assignment) => isOwner(assignment.role)).length;
    const accountableCount = assignments.filter(
      (assignment) => assignment.role === "accountable_owner"
    ).length;

    if (ownerCount === 0) {
      setFeedback({ tone: "error", message: "Choose at least one accountable or shared owner." });
      return;
    }

    if (
      ownerCount === 1 &&
      assignments.some((assignment) => assignment.role === "shared_owner")
    ) {
      setFeedback({ tone: "error", message: "Shared ownership needs two owners." });
      return;
    }

    if (accountableCount > 1) {
      setFeedback({ tone: "error", message: "Choose no more than one accountable owner." });
      return;
    }

    if (removesCurrentOwner && !handoffMode) {
      setFeedback({ tone: "error", message: "Choose what happens to the former owner." });
      return;
    }

    if (!onSave) {
      return;
    }

    setPending(true);
    try {
      await onSave({
        assignments,
        expectedUpdatedAt,
        expectedOwnerPersonaKeys: [...currentOwnerKeys].sort(),
        handoffMode: removesCurrentOwner ? handoffMode : null,
        handoffNotes: handoffNotes.trim() || null,
        reviewAt: reviewDate ? `${reviewDate}T12:00:00.000Z` : null
      });
      setFeedback({ tone: "success", message: "Ownership agreement saved." });
    } catch {
      setFeedback({ tone: "error", message: "Unable to save the ownership agreement. Try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="ownership-details-heading"
      className="grid gap-4 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-4"
    >
      <div className="grid gap-1">
        <h2 className="text-[18px] font-bold text-fp-ink" id="ownership-details-heading">
          Ownership details
        </h2>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          Record who owns the outcome, who shares it, and who is helping or backing it up.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {personas.map((persona) => (
          <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink" key={persona.key}>
            {persona.displayName} role
            <select
              className="fp-input min-h-11 px-3 text-[15px]"
              disabled={!onSave || pending}
              onChange={(event) => {
                setRoles((current) => ({
                  ...current,
                  [persona.key]: event.target.value as OwnershipRole
                }));
                setFeedback(null);
              }}
              value={roles[persona.key]}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {label(role)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {removesCurrentOwner ? (
        <fieldset className="grid gap-2 rounded-[8px] border border-fp-line p-3">
          <legend className="px-1 text-[13px] font-bold text-fp-ink">
            Former owner handoff
          </legend>
          <label className="flex min-h-11 items-center gap-3 text-[13px] font-semibold text-fp-ink">
            <input
              checked={handoffMode === "replace_former_owner"}
              disabled={!onSave || pending}
              name="handoff-mode"
              onChange={() => setHandoffMode("replace_former_owner")}
              type="radio"
            />
            Replace the former owner
          </label>
          <label className="flex min-h-11 items-center gap-3 text-[13px] font-semibold text-fp-ink">
            <input
              checked={handoffMode === "retain_former_owner_as_helper"}
              disabled={!onSave || pending}
              name="handoff-mode"
              onChange={() => setHandoffMode("retain_former_owner_as_helper")}
              type="radio"
            />
            Keep the former owner as a helper
          </label>
          <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
            Optional handoff note
            <textarea
              className="fp-input min-h-24 px-3 py-2 text-[15px]"
              disabled={!onSave || pending}
              onChange={(event) => setHandoffNotes(event.target.value)}
              value={handoffNotes}
            />
          </label>
        </fieldset>
      ) : null}

      <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
        Review date
        <input
          className="fp-input min-h-11 px-3 text-[15px]"
          disabled={!onSave || pending}
          onChange={(event) => setReviewDate(event.target.value)}
          type="date"
          value={reviewDate}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!onSave || pending} onClick={() => void save()} variant="primary">
          {pending ? "Saving..." : "Save ownership details"}
        </Button>
        {feedback ? (
          <p
            className={feedback.tone === "error" ? "text-[13px] font-semibold text-fp-danger" : "text-[13px] font-semibold text-fp-ink"}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
