import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OwnershipDetails } from "./ownership-details";

const personas = [
  { id: "550e8400-e29b-41d4-a716-446655440001", key: "alex", displayName: "Alex" },
  { id: "550e8400-e29b-41d4-a716-446655440002", key: "max", displayName: "Max" }
] as const;

describe("OwnershipDetails", () => {
  it("requires an explicit handoff choice when an owner is removed", async () => {
    const onSave = vi.fn();
    render(
      <OwnershipDetails
        currentAssignments={[
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ]}
        expectedUpdatedAt="2026-05-04T12:00:00.000Z"
        nextReviewAt={null}
        onSave={onSave}
        personas={personas}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Alex role"), "none");
    await userEvent.selectOptions(screen.getByLabelText("Max role"), "accountable_owner");
    await userEvent.click(screen.getByRole("button", { name: "Save ownership details" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose what happens to the former owner."
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("submits a retain-as-helper handoff with review timing", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <OwnershipDetails
        currentAssignments={[
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ]}
        expectedUpdatedAt="2026-05-04T12:00:00.000Z"
        nextReviewAt={null}
        onSave={onSave}
        personas={personas}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Alex role"), "none");
    await userEvent.selectOptions(screen.getByLabelText("Max role"), "accountable_owner");
    await userEvent.click(
      screen.getByRole("radio", { name: "Keep the former owner as a helper" })
    );
    await userEvent.type(screen.getByLabelText("Optional handoff note"), "Walk through the routine.");
    await userEvent.type(screen.getByLabelText("Review date"), "2026-08-01");
    await userEvent.click(screen.getByRole("button", { name: "Save ownership details" }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        expectedUpdatedAt: "2026-05-04T12:00:00.000Z",
        expectedOwnerPersonaKeys: ["alex"],
        handoffMode: "retain_former_owner_as_helper",
        handoffNotes: "Walk through the routine.",
        reviewAt: "2026-08-01T12:00:00.000Z"
      })
    );
    expect(screen.getByRole("status")).toHaveTextContent("Ownership agreement saved.");
  });

  it("resyncs a retained helper from the authoritative agreement before another save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <OwnershipDetails
        currentAssignments={[
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ]}
        expectedUpdatedAt="2026-05-04T12:00:00.000Z"
        nextReviewAt={null}
        onSave={onSave}
        personas={personas}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Alex role"), "none");
    await userEvent.selectOptions(screen.getByLabelText("Max role"), "accountable_owner");
    await userEvent.click(
      screen.getByRole("radio", { name: "Keep the former owner as a helper" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Save ownership details" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());

    rerender(
      <OwnershipDetails
        currentAssignments={[
          { personaKey: "alex", role: "helper", scope: "support" },
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ]}
        expectedUpdatedAt="2026-05-04T12:01:00.000Z"
        nextReviewAt={null}
        onSave={onSave}
        personas={personas}
      />
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Alex role")).toHaveValue("helper")
    );
    await userEvent.click(screen.getByRole("button", { name: "Save ownership details" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave.mock.calls[1]?.[0]).toMatchObject({
      assignments: [
        { personaKey: "alex", role: "helper", scope: "support" },
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      expectedOwnerPersonaKeys: ["max"],
      expectedUpdatedAt: "2026-05-04T12:01:00.000Z"
    });
  });

  it("supports genuine shared ownership without asking for a handoff", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <OwnershipDetails
        currentAssignments={[
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ]}
        expectedUpdatedAt="2026-05-04T12:00:00.000Z"
        nextReviewAt="2026-07-20T12:00:00.000Z"
        onSave={onSave}
        personas={personas}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Max role"), "shared_owner");
    expect(screen.queryByRole("group", { name: "Former owner handoff" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save ownership details" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]?.[0]).toMatchObject({
      handoffMode: null,
      reviewAt: "2026-07-20T12:00:00.000Z"
    });
  });

  it("does not save a shared-owner role without another owner", async () => {
    const onSave = vi.fn();
    render(
      <OwnershipDetails
        currentAssignments={[
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ]}
        expectedUpdatedAt="2026-05-04T12:00:00.000Z"
        nextReviewAt={null}
        onSave={onSave}
        personas={personas}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Alex role"), "none");
    await userEvent.selectOptions(screen.getByLabelText("Max role"), "shared_owner");
    await userEvent.click(screen.getByRole("button", { name: "Save ownership details" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Shared ownership needs two owners."
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});
