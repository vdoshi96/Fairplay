import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";
import { Chip } from "./chip";
import { IconButton } from "./icon-button";
import { SegmentedControl } from "./segmented-control";

describe("UI primitives", () => {
  it("renders accessible icon buttons", async () => {
    const onClick = vi.fn();

    render(
      <IconButton
        aria-label="Restart crash course"
        icon={<span aria-hidden>R</span>}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Restart crash course" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps chips compact and label-aware", () => {
    render(<Chip tone="caregiving">Caregiving</Chip>);

    expect(screen.getByText("Caregiving")).toHaveClass("max-w-full");
  });

  it("supports segmented keyboard-sized choices", async () => {
    const onChange = vi.fn();

    render(
      <SegmentedControl
        ariaLabel="Board view"
        onChange={onChange}
        options={[
          { value: "board", label: "Board" },
          { value: "list", label: "List" }
        ]}
        value="board"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "List" }));

    expect(onChange).toHaveBeenCalledWith("list");
  });

  it("renders button variants without layout-only text wrappers", () => {
    render(<Button variant="primary">Open library</Button>);

    expect(screen.getByRole("button", { name: "Open library" })).toHaveClass(
      "rounded-[8px]"
    );
  });
});
