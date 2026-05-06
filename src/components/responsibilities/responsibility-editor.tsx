"use client";

import { useMemo, useState } from "react";

import type { PersonaSummary } from "@/contracts/personas";
import type {
  ResponsibilityAssignmentSummary,
  ResponsibilityDetail
} from "@/contracts/responsibilities";
import type {
  AssignmentRole,
  AssignmentScope,
  Cadence,
  PersonaKey,
  ResponsibilityStatus,
  Visibility
} from "@/domain/enums";

type ResponsibilityEditorProps = {
  personas: [PersonaSummary, PersonaSummary];
  initialResponsibility?: ResponsibilityDetail | null;
  onStatusChange?: (input: {
    status: "archived" | "paused" | "not_relevant" | "active" | "needs_review";
    confirmedArchive?: boolean;
  }) => void;
};

const roleOptions = [
  "none",
  "accountable_owner",
  "shared_owner",
  "helper",
  "backup"
] as const;
const scopeOptions = ["outcome", "part", "support", "temporary"] as const;
const cadenceOptions = [
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "event_based",
  "as_needed",
  "one_time"
] as const;
const statusOptions = [
  "unassigned",
  "active",
  "needs_review",
  "paused",
  "not_relevant"
] as const;
const hiddenEffortOptions = [
  "noticing",
  "planning",
  "doing",
  "follow_through",
  "emotional_attention"
] as const;
const visibilityOptions = [
  "shared_household",
  "partner_visible",
  "check_in_only"
] as const;

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function assignmentFor(
  assignments: readonly ResponsibilityAssignmentSummary[],
  personaKey: PersonaKey
) {
  return assignments.find((assignment) => assignment.personaKey === personaKey);
}

function accountableOwners(assignments: readonly ResponsibilityAssignmentSummary[]) {
  return assignments
    .filter((assignment) => assignment.role === "accountable_owner")
    .map((assignment) => assignment.personaKey)
    .sort()
    .join(",");
}

function listInput(value: string) {
  const values = value
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  return values.length > 0 ? values : null;
}

export function ResponsibilityEditor({
  personas,
  initialResponsibility = null,
  onStatusChange
}: ResponsibilityEditorProps) {
  const [title, setTitle] = useState(initialResponsibility?.title ?? "");
  const [summary, setSummary] = useState(initialResponsibility?.summary ?? "");
  const [areaKeys, setAreaKeys] = useState(
    initialResponsibility?.areaKeys.join(", ") ?? ""
  );
  const [cadence, setCadence] = useState(initialResponsibility?.cadence ?? "weekly");
  const [relevantDays, setRelevantDays] = useState(
    initialResponsibility?.relevantDays.join(", ") ?? ""
  );
  const [status, setStatus] = useState(initialResponsibility?.status ?? "unassigned");
  const [visibility, setVisibility] = useState<Exclude<Visibility, "private">>(
    initialResponsibility?.visibility === "partner_visible" ||
      initialResponsibility?.visibility === "check_in_only"
      ? initialResponsibility.visibility
      : "shared_household"
  );
  const [householdStandard, setHouseholdStandard] = useState(
    initialResponsibility?.householdStandard ?? ""
  );
  const [notes, setNotes] = useState(initialResponsibility?.notes ?? "");
  const [nextReviewAt, setNextReviewAt] = useState(
    initialResponsibility?.nextReviewAt?.slice(0, 10) ?? ""
  );
  const [hiddenEffortKeys, setHiddenEffortKeys] = useState<string[]>(
    initialResponsibility?.hiddenEffortKeys ?? []
  );
  const [assignments, setAssignments] = useState<
    Record<PersonaKey, { role: (typeof roleOptions)[number]; scope: AssignmentScope }>
  >(() => {
    const alex = assignmentFor(initialResponsibility?.currentAssignments ?? [], "alex");
    const max = assignmentFor(initialResponsibility?.currentAssignments ?? [], "max");

    return {
      alex: {
        role: alex?.role ?? "none",
        scope: alex?.scope ?? "outcome"
      },
      max: {
        role: max?.role ?? "none",
        scope: max?.scope ?? "outcome"
      }
    };
  });
  const [handoffNotes, setHandoffNotes] = useState("");
  const [revisitAt, setRevisitAt] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const assignmentList = useMemo(
    () =>
      personas.flatMap((persona) => {
        const assignment = assignments[persona.key];
        if (assignment.role === "none") {
          return [];
        }

        return [
          {
            personaKey: persona.key,
            role: assignment.role as AssignmentRole,
            scope: assignment.scope
          }
        ];
      }),
    [assignments, personas]
  );
  const ownerChanged =
    accountableOwners(initialResponsibility?.currentAssignments ?? []) !==
    accountableOwners(assignmentList);

  function setRole(personaKey: PersonaKey, role: (typeof roleOptions)[number]) {
    setAssignments((current) => ({
      ...current,
      [personaKey]: {
        ...current[personaKey],
        role
      }
    }));
  }

  function setScope(personaKey: PersonaKey, scope: AssignmentScope) {
    setAssignments((current) => ({
      ...current,
      [personaKey]: {
        ...current[personaKey],
        scope
      }
    }));
  }

  function toggleHiddenEffort(key: string) {
    setHiddenEffortKeys((current) =>
      current.includes(key)
        ? current.filter((candidate) => candidate !== key)
        : [...current, key]
    );
  }

  async function save() {
    const editBody = {
      title,
      summary: summary || null,
      areaKeys: areaKeys
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean),
      hiddenEffortKeys,
      cadence,
      relevantDays: listInput(relevantDays),
      householdStandard: householdStandard || null,
      notes: notes || null,
      nextReviewAt: nextReviewAt ? `${nextReviewAt}T12:00:00.000Z` : null
    };
    const createBody = {
      ...editBody,
      status,
      currentAssignments: assignmentList,
      visibility
    };
    const url = initialResponsibility
      ? `/api/responsibilities/${initialResponsibility.id}`
      : "/api/responsibilities";

    await fetch(url, {
      method: initialResponsibility ? "PATCH" : "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(initialResponsibility ? editBody : createBody)
    });

    if (initialResponsibility) {
      await fetch(`/api/responsibilities/${initialResponsibility.id}/assignments`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          effectiveAt: new Date().toISOString(),
          assignments: assignmentList,
          handoffNotes: handoffNotes || undefined,
          revisitAt: revisitAt ? `${revisitAt}T12:00:00.000Z` : undefined
        })
      });

      if (visibility !== initialResponsibility.visibility) {
        await fetch(`/api/responsibilities/${initialResponsibility.id}/visibility`, {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            responsibilityId: initialResponsibility.id,
            fromVisibility: initialResponsibility.visibility,
            toVisibility: visibility,
            confirmedVisibilityChange: true
          })
        });
      }
    }
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-1">
        <p className="text-[13px] font-semibold text-fp-muted-ink">
          Responsibility
        </p>
        <h1 className="text-[28px] font-bold leading-[34px]">
          {initialResponsibility ? "Edit responsibility" : "New responsibility"}
        </h1>
      </div>

      <div className="grid gap-4 rounded-[8px] border border-fp-line bg-white p-4">
        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Title
          <input
            className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>

        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Summary
          <textarea
            className="min-h-24 rounded-[8px] border border-fp-line px-3 py-2 text-[15px] text-fp-ink"
            onChange={(event) => setSummary(event.target.value)}
            value={summary}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Area keys
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => setAreaKeys(event.target.value)}
              value={areaKeys}
            />
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Cadence
            <select
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => setCadence(event.target.value as Cadence)}
              value={cadence}
            >
              {cadenceOptions.map((option) => (
                <option key={option} value={option}>
                  {label(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Relevant days
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => setRelevantDays(event.target.value)}
              value={relevantDays}
            />
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Visibility
            <select
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) =>
                setVisibility(
                  event.target.value as Exclude<Visibility, "private">
                )
              }
              value={visibility}
            >
              {visibilityOptions.map((option) => (
                <option key={option} value={option}>
                  {label(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Status
            <select
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) =>
                setStatus(event.target.value as ResponsibilityStatus)
              }
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {label(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
            Next review date
            <input
              className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
              onChange={(event) => setNextReviewAt(event.target.value)}
              type="date"
              value={nextReviewAt}
            />
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-[13px] font-semibold text-fp-muted-ink">
            Hidden effort
          </legend>
          <div className="flex flex-wrap gap-2">
            {hiddenEffortOptions.map((option) => (
              <label
                className="flex min-h-11 items-center gap-2 rounded-[8px] border border-fp-line px-3 text-[13px] font-semibold"
                key={option}
              >
                <input
                  checked={hiddenEffortKeys.includes(option)}
                  onChange={() => toggleHiddenEffort(option)}
                  type="checkbox"
                />
                {label(option)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Household standard
          <textarea
            className="min-h-24 rounded-[8px] border border-fp-line px-3 py-2 text-[15px] text-fp-ink"
            onChange={(event) => setHouseholdStandard(event.target.value)}
            value={householdStandard}
          />
        </label>

        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Notes
          <textarea
            className="min-h-24 rounded-[8px] border border-fp-line px-3 py-2 text-[15px] text-fp-ink"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-[8px] border border-fp-line bg-white p-4">
        <h2 className="text-[18px] font-bold">Assignments</h2>
        {personas.map((persona) => (
          <div className="grid gap-3 sm:grid-cols-2" key={persona.key}>
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              {persona.displayName} role
              <select
                className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
                onChange={(event) =>
                  setRole(
                    persona.key,
                    event.target.value as (typeof roleOptions)[number]
                  )
                }
                value={assignments[persona.key].role}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {label(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              {persona.displayName} scope
              <select
                className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
                onChange={(event) =>
                  setScope(persona.key, event.target.value as AssignmentScope)
                }
                value={assignments[persona.key].scope}
              >
                {scopeOptions.map((option) => (
                  <option key={option} value={option}>
                    {label(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}

        {ownerChanged ? (
          <div className="grid gap-3 rounded-[8px] border border-fp-line bg-fp-surface p-3">
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              Handoff context
              <textarea
                className="min-h-24 rounded-[8px] border border-fp-line px-3 py-2 text-[15px] text-fp-ink"
                onChange={(event) => setHandoffNotes(event.target.value)}
                value={handoffNotes}
              />
            </label>
            <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
              Revisit date
              <input
                className="min-h-11 rounded-[8px] border border-fp-line px-3 text-[15px] text-fp-ink"
                onChange={(event) => setRevisitAt(event.target.value)}
                type="date"
                value={revisitAt}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="min-h-11 rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary"
          onClick={save}
          type="button"
        >
          Save
        </button>
        {initialResponsibility ? (
          <>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold"
              onClick={() => {
                if (onStatusChange) {
                  onStatusChange({ status: "paused" });
                  return;
                }

                fetch(`/api/responsibilities/${initialResponsibility.id}/status`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ status: "paused" })
                });
              }}
              type="button"
            >
              Pause
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold"
              onClick={() => {
                if (onStatusChange) {
                  onStatusChange({ status: "not_relevant" });
                  return;
                }

                fetch(`/api/responsibilities/${initialResponsibility.id}/status`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ status: "not_relevant" })
                });
              }}
              type="button"
            >
              Mark not relevant
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold"
              onClick={() =>
                fetch(`/api/responsibilities/${initialResponsibility.id}/radar-flag`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    reasonKey: "review_due",
                    visibility: "private"
                  })
                })
              }
              type="button"
            >
              Flag for radar
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-danger bg-white px-4 text-[14px] font-bold text-fp-danger"
              onClick={() => setArchiveOpen(true)}
              type="button"
            >
              Archive
            </button>
          </>
        ) : null}
      </div>

      {archiveOpen ? (
        <div
          aria-label="Archive responsibility?"
          aria-modal="true"
          className="fixed inset-0 z-20 grid place-items-center bg-fp-ink/30 p-4"
          role="dialog"
        >
          <div className="grid w-full max-w-sm gap-4 rounded-[8px] border border-fp-line bg-white p-4">
            <h2 className="text-[18px] font-bold">Archive responsibility?</h2>
            <p className="text-[14px] leading-6 text-fp-muted-ink">
              This keeps the history but removes it from the active planning view.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold"
                onClick={() => setArchiveOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-11 rounded-[8px] bg-fp-danger px-4 text-[14px] font-bold text-white"
                onClick={() => {
                  setArchiveOpen(false);
                  if (onStatusChange) {
                    onStatusChange({
                      status: "archived",
                      confirmedArchive: true
                    });
                    return;
                  }

                  fetch(
                    `/api/responsibilities/${initialResponsibility?.id}/status`,
                    {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        status: "archived",
                        confirmedArchive: true
                      })
                    }
                  );
                }}
                type="button"
              >
                Confirm archive
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
