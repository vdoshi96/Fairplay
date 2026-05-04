import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import { ResponsibilityEditor } from "./responsibility-editor";

const personas: [PersonaSummary, PersonaSummary] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    key: "alex",
    displayName: "Alex"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    key: "max",
    displayName: "Max"
  }
];

const responsibility: ResponsibilityDetail = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  title: "Weekly meal outline",
  summary: null,
  areaKeys: ["food_flow"],
  hiddenEffortKeys: ["planning"],
  cadence: "weekly",
  status: "active",
  visibility: "shared_household",
  currentAssignments: [
    { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
  ],
  nextReviewAt: null,
  householdStandard: null,
  notes: null,
  lifecycleNotes: null,
  lastReviewedAt: null,
  createdAt: "2026-05-04T12:00:00.000Z",
  updatedAt: "2026-05-04T12:00:00.000Z",
  archivedAt: null
};

describe("ResponsibilityEditor", () => {
  it("shows assignment controls and handoff prompts only after accountable owner changes", () => {
    render(
      <ResponsibilityEditor
        initialResponsibility={responsibility}
        personas={personas}
      />
    );

    expect(screen.getByLabelText("Alex role")).toHaveValue("accountable_owner");
    expect(screen.queryByLabelText("Handoff context")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Alex role"), {
      target: { value: "helper" }
    });
    fireEvent.change(screen.getByLabelText("Max role"), {
      target: { value: "accountable_owner" }
    });

    expect(screen.getByLabelText("Handoff context")).toBeVisible();
    expect(screen.getByLabelText("Revisit date")).toBeVisible();
  });

  it("requires archive confirmation before calling the status action", () => {
    const onStatusChange = vi.fn();
    render(
      <ResponsibilityEditor
        initialResponsibility={responsibility}
        onStatusChange={onStatusChange}
        personas={personas}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    expect(screen.getByRole("dialog", { name: "Archive responsibility?" })).toBeVisible();
    expect(onStatusChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm archive" }));

    expect(onStatusChange).toHaveBeenCalledWith({
      status: "archived",
      confirmedArchive: true
    });
  });
});
