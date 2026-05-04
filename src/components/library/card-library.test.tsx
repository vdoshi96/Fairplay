import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CardTemplateSummary } from "@/contracts/card-templates";
import { CardLibrary } from "./card-library";

const templates: CardTemplateSummary[] = [
  {
    id: "tpl_auto",
    slug: "auto",
    title: "Auto",
    labels: ["Out", "Daily Grind"],
    summary: "Vehicle responsibility summary.",
    coverAssetPath: "/assets/fairplay/cards/auto.png",
    defaultLane: "not_in_play"
  },
  {
    id: "tpl_homework",
    slug: "homework",
    title: "Homework",
    labels: ["Kids", "Home"],
    summary: "School follow-through.",
    coverAssetPath: "/assets/fairplay/cards/homework.png",
    defaultLane: "not_in_play"
  }
];

describe("CardLibrary", () => {
  it("searches source cards and starts a household card from a template", async () => {
    const onCreateFromTemplate = vi.fn();
    render(
      <CardLibrary
        onCreateFromTemplate={onCreateFromTemplate}
        templates={templates}
      />
    );

    await userEvent.type(screen.getByRole("searchbox", { name: /search cards/i }), "auto");

    const autoCard = screen.getByRole("article", { name: /auto/i });
    expect(within(autoCard).getByText("Vehicle responsibility summary.")).toBeVisible();
    expect(within(autoCard).getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.queryByText("Homework")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /put Auto in play/i }));

    expect(onCreateFromTemplate).toHaveBeenCalledWith("tpl_auto");
  });

  it("filters by source label while preserving stable card presentation", async () => {
    render(<CardLibrary templates={templates} />);

    await userEvent.click(screen.getByRole("button", { name: "Kids" }));

    expect(screen.getByText("Homework")).toBeVisible();
    expect(screen.queryByText("Auto")).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: /homework/i })).toHaveClass(
      "min-h-[420px]"
    );
  });
});
