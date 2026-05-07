import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  relevantDays: ["monday", "thursday"],
  status: "active",
  visibility: "shared_household",
  linkedRadarItems: [],
  currentAssignments: [
    { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
  ],
  boardLane: "player_1",
  boardSortOrder: 0,
  nextReviewAt: null,
  householdStandard: null,
  notes: null,
  lifecycleNotes: null,
  lastReviewedAt: null,
  sourceDefinition: null,
  sourceConception: null,
  sourcePlanning: null,
  sourceExecution: null,
  sourceMinimumStandard: null,
  sourceCoverAssetPath: null,
  createdAt: "2026-05-04T12:00:00.000Z",
  updatedAt: "2026-05-04T12:00:00.000Z",
  archivedAt: null
};

describe("ResponsibilityEditor", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("saves existing edit fields without visibility and uses the dedicated visibility path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ResponsibilityEditor
        initialResponsibility={responsibility}
        personas={personas}
      />
    );

    fireEvent.change(screen.getByLabelText("Relevant days"), {
      target: { value: "monday, friday" }
    });
    fireEvent.change(screen.getByLabelText("Visibility"), {
      target: { value: "partner_visible" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    const editCall = fetchMock.mock.calls[0];
    const editBody = JSON.parse(editCall[1].body);
    expect(editCall[0]).toBe(`/api/responsibilities/${responsibility.id}`);
    expect(editCall[1].method).toBe("PATCH");
    expect(editBody).toMatchObject({
      relevantDays: ["monday", "friday"]
    });
    expect(editBody).not.toHaveProperty("visibility");
    expect(editBody).not.toHaveProperty("status");
    expect(editBody).not.toHaveProperty("currentAssignments");

    const assignmentCall = fetchMock.mock.calls[1];
    expect(assignmentCall[0]).toBe(
      `/api/responsibilities/${responsibility.id}/assignments`
    );
    expect(assignmentCall[1].method).toBe("POST");
    expect(JSON.parse(assignmentCall[1].body)).toMatchObject({
      assignments: [
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
      ]
    });

    const visibilityCall = fetchMock.mock.calls[2];
    expect(visibilityCall[0]).toBe(
      `/api/responsibilities/${responsibility.id}/visibility`
    );
    expect(visibilityCall[1].method).toBe("POST");
    expect(JSON.parse(visibilityCall[1].body)).toMatchObject({
      responsibilityId: responsibility.id,
      fromVisibility: "shared_household",
      toVisibility: "partner_visible",
      confirmedVisibilityChange: true
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
  });

  it("includes relevant days and non-private visibility when creating", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ResponsibilityEditor personas={personas} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Morning launch" }
    });
    fireEvent.change(screen.getByLabelText("Area keys"), {
      target: { value: "school_flow" }
    });
    fireEvent.change(screen.getByLabelText("Relevant days"), {
      target: { value: "weekday" }
    });
    fireEvent.change(screen.getByLabelText("Visibility"), {
      target: { value: "check_in_only" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const createBody = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/responsibilities");
    expect(createBody).toMatchObject({
      title: "Morning launch",
      relevantDays: ["weekday"],
      visibility: "check_in_only"
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
  });

  it("reports save failures and stops follow-up writes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unable to save this responsibility." })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ResponsibilityEditor
        initialResponsibility={responsibility}
        personas={personas}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save this responsibility."
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports status update success and failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Unable to pause this responsibility." })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ResponsibilityEditor
        initialResponsibility={responsibility}
        personas={personas}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to pause this responsibility."
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark not relevant" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Marked not relevant."
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      `/api/responsibilities/${responsibility.id}/status`
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      status: "not_relevant"
    });
  });

  it("does not expose radar flagging from the responsibility editor", () => {
    render(
      <ResponsibilityEditor
        initialResponsibility={responsibility}
        personas={personas}
      />
    );

    expect(screen.queryByRole("button", { name: /radar/i })).not.toBeInTheDocument();
  });
});
