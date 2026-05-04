import { render, screen, within } from "@testing-library/react";
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
  it("shows source cover, ownership, CPE, standards, and action hooks", async () => {
    const onMove = vi.fn();
    const onFlagForRadar = vi.fn();
    render(
      <CardDetailSheet
        card={card}
        onFlagForRadar={onFlagForRadar}
        onMove={onMove}
      />
    );

    expect(screen.getByRole("heading", { name: "Auto" })).toBeVisible();
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.getByText("Cards of Concern")).toBeVisible();
    expect(screen.getByText("Out")).toBeVisible();
    expect(screen.getByText("Daily Grind")).toBeVisible();

    const cpe = screen.getByRole("region", { name: /CPE sections/i });
    expect(within(cpe).getByText("Notice repairs and timing.")).toBeVisible();
    expect(within(cpe).getByText("Schedule service and arrange transport.")).toBeVisible();
    expect(within(cpe).getByText("Complete service and follow-through.")).toBeVisible();
    expect(screen.getByText("Vehicle is safe, legal, and available.")).toBeVisible();
    expect(
      screen.getByText("Both drivers can use the car safely each weekday.")
    ).toBeVisible();
    expect(screen.getByText("Insurance card lives in the glove box.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /move to Player 1/i }));
    await userEvent.click(screen.getByRole("button", { name: /flag for radar/i }));

    expect(onMove).toHaveBeenCalledWith("player_1");
    expect(onFlagForRadar).toHaveBeenCalledTimes(1);
  });
});
