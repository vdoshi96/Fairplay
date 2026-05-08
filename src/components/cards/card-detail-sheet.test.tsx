import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CardDetailSheet } from "./card-detail-sheet";

const card = {
  id: "resp_123",
  title: "Auto",
  labels: ["Out", "Daily Grind"],
  boardLane: "cards_of_concern",
  ownerLabel: "Cards of Concern",
  definition: "Keep vehicle needs visible and handled.",
  conception: "Notice repairs and timing.",
  planning: "Schedule service and arrange transport.",
  execution: "Complete service and follow-through.",
  minimumStandard: "Vehicle is safe, legal, and available.",
  householdStandard: "Both drivers can use the car safely each weekday.",
  notes: "Insurance card lives in the glove box.",
  coverAssetPath: "/assets/fairplay/cards/auto.png"
} as const;

describe("CardDetailSheet", () => {
  it("shows source cover, ownership, purpose, Fogging Estandards, and lane move", async () => {
    const onMove = vi.fn();
    render(
      <CardDetailSheet
        card={card}
        onMove={onMove}
      />
    );

    expect(screen.getByRole("heading", { name: "Auto" })).toBeVisible();
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.getByText(/Assigned to Cards of Concern/i)).toBeVisible();
    expect(screen.getByText("Unassigned")).toBeVisible();
    expect(screen.getByText("Out")).toBeVisible();
    expect(screen.getByText("Daily Grind")).toBeVisible();
    expect(screen.getByText("What is this card for?")).toBeVisible();
    expect(screen.getByText("Keep vehicle needs visible and handled.")).toBeVisible();
    expect(screen.getByText("Fogging Estandards")).toBeVisible();
    expect(screen.getByLabelText("Fogging Estandards")).toHaveValue(
      "Both drivers can use the car safely each weekday."
    );
    expect(screen.queryByText("CPE")).not.toBeInTheDocument();
    expect(screen.queryByText("Insurance card lives in the glove box.")).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText("Move destination"), "alex");
    await userEvent.click(screen.getByRole("button", { name: "Move" }));

    expect(onMove).toHaveBeenCalledWith("alex");
  });

  it("renders accepted AI-generated cover art as a larger integrated panel", () => {
    const generatedCard = {
      ...card,
      title: "Dog Medicine",
      coverAssetPath: null,
      sourceCoverAssetPath:
        "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
    };

    render(<CardDetailSheet card={generatedCard} />);

    const artPanel = screen.getByTestId("generated-cover-art-panel");
    expect(artPanel).toHaveClass("min-h-[520px]");
    expect(artPanel).toHaveClass("lg:min-h-[700px]");
    expect(screen.getByRole("img", { name: /dog medicine cover/i })).toHaveAttribute(
      "src",
      "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
    );
    expect(screen.getByRole("img", { name: /dog medicine cover/i })).toHaveClass(
      "object-cover"
    );
  });

  it("renders source-card sourceCoverAssetPath with legacy object-contain art treatment", () => {
    const sourceCard = {
      ...card,
      coverAssetPath: null,
      sourceCoverAssetPath: "/assets/fairplay/cards/auto.png"
    };

    render(<CardDetailSheet card={sourceCard} />);

    expect(screen.queryByTestId("generated-cover-art-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("source-cover-art-panel")).toBeVisible();
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveClass(
      "object-contain"
    );
  });

  it("edits Fogging Estandards from the current default standard", async () => {
    const onSaveStandards = vi.fn().mockResolvedValue(undefined);
    render(
      <CardDetailSheet
        card={{
          ...card,
          householdStandard: null
        }}
        onSaveStandards={onSaveStandards}
      />
    );

    const textarea = screen.getByLabelText("Fogging Estandards");
    expect(textarea).toHaveValue("Vehicle is safe, legal, and available.");
    expect(textarea).toHaveClass("min-h-32", "w-full");

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Car is fueled, safe, and ready by Sunday night.");
    await userEvent.click(screen.getByRole("button", { name: "Save Estandards" }));

    await waitFor(() =>
      expect(onSaveStandards).toHaveBeenCalledWith(
        "Car is fueled, safe, and ready by Sunday night."
      )
    );
  });

  it("keeps lane movement disabled when no move hook is wired", () => {
    render(<CardDetailSheet card={card} />);

    expect(screen.getByText("What is this card for?")).toBeVisible();
    expect(screen.getByText("Fogging Estandards")).toBeVisible();
    expect(screen.getByLabelText("Move destination")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /schedule check-in/i }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Trim$/i }))
      .not.toBeInTheDocument();
  });
});
