import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { AlertDialog, Dialog } from "./dialog";

function DialogHarness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    onClose();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} ref={triggerRef} type="button">
        Open archive confirmation
      </button>
      <button type="button">Background action</button>
      <AlertDialog
        description="The responsibility history will remain available."
        initialFocusRef={cancelRef}
        onClose={close}
        open={open}
        title="Archive responsibility?"
        triggerRef={triggerRef}
      >
        <div className="flex gap-2">
          <button onClick={close} ref={cancelRef} type="button">
            Cancel
          </button>
          <button type="button">Confirm archive</button>
        </div>
      </AlertDialog>
    </>
  );
}

describe("Dialog", () => {
  it("labels an alert dialog with its title and description", async () => {
    render(<DialogHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open archive confirmation" })
    );

    const dialog = await screen.findByRole("alertdialog", {
      name: "Archive responsibility?"
    });
    expect(dialog).toHaveAccessibleDescription(
      "The responsibility history will remain available."
    );
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("moves initial focus inside and traps Tab and Shift+Tab", async () => {
    render(<DialogHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: "Open archive confirmation" })
    );

    const dialog = await screen.findByRole("alertdialog");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm archive" });

    await waitFor(() => expect(cancel).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancel).toHaveFocus();

    confirm.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancel).toHaveFocus();
  });

  it("isolates background interaction and restores prior attributes", async () => {
    const { container } = render(<DialogHarness />);
    container.setAttribute("data-existing", "true");

    fireEvent.click(
      screen.getByRole("button", { name: "Open archive confirmation" })
    );
    await screen.findByRole("alertdialog");

    expect(container).toHaveAttribute("aria-hidden", "true");
    expect(container).toHaveAttribute("inert");
    expect(container).toHaveAttribute("data-existing", "true");
    expect(
      screen.queryByRole("button", { name: "Background action" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(container).not.toHaveAttribute("aria-hidden");
      expect(container).not.toHaveAttribute("inert");
    });
    expect(container).toHaveAttribute("data-existing", "true");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    const trigger = screen.getByRole("button", {
      name: "Open archive confirmation"
    });

    fireEvent.click(trigger);
    const dialog = await screen.findByRole("alertdialog");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    );

    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("falls back to focusing an empty dialog panel", async () => {
    function EmptyDialog() {
      return (
        <Dialog
          description="No available actions."
          onClose={vi.fn()}
          open
          title="Information"
        >
          <span>Read-only content</span>
        </Dialog>
      );
    }

    render(<EmptyDialog />);

    const dialog = await screen.findByRole("dialog", { name: "Information" });
    await waitFor(() => expect(dialog).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(dialog).toHaveFocus();
  });

  it("does not honor an initial-focus target outside the dialog", async () => {
    function OutsideFocusTarget() {
      const backgroundRef = useRef<HTMLButtonElement>(null);

      return (
        <>
          <button ref={backgroundRef} type="button">
            Background target
          </button>
          <Dialog
            description="Focus stays within this surface."
            initialFocusRef={backgroundRef}
            onClose={vi.fn()}
            open
            title="Contained focus"
          >
            <button type="button">Inside action</button>
          </Dialog>
        </>
      );
    }

    render(<OutsideFocusTarget />);

    const insideAction = await screen.findByRole("button", {
      name: "Inside action"
    });
    await waitFor(() => expect(insideAction).toHaveFocus());
  });
});
