"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

type DialogRole = "dialog" | "alertdialog";

export type DialogProps = {
  children: ReactNode;
  className?: string;
  description: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  open: boolean;
  role?: DialogRole;
  title: ReactNode;
  triggerRef?: RefObject<HTMLElement | null>;
};

type BackgroundState = {
  ariaHidden: string | null;
  element: HTMLElement;
  hadInertAttribute: boolean;
  inertValue: boolean | null;
};

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true"
  );
}

function isolateBackground(portalHost: HTMLElement): BackgroundState[] {
  return Array.from(document.body.children)
    .filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== portalHost
    )
    .map((element) => {
      const state: BackgroundState = {
        ariaHidden: element.getAttribute("aria-hidden"),
        element,
        hadInertAttribute: element.hasAttribute("inert"),
        inertValue:
          "inert" in element
            ? (element as HTMLElement & { inert: boolean }).inert
            : null
      };

      element.setAttribute("aria-hidden", "true");
      element.setAttribute("inert", "");

      if ("inert" in element) {
        (element as HTMLElement & { inert: boolean }).inert = true;
      }

      return state;
    });
}

function restoreBackground(states: readonly BackgroundState[]) {
  for (const state of states) {
    if (state.ariaHidden === null) {
      state.element.removeAttribute("aria-hidden");
    } else {
      state.element.setAttribute("aria-hidden", state.ariaHidden);
    }

    if (state.inertValue !== null) {
      (state.element as HTMLElement & { inert: boolean }).inert =
        state.inertValue;
    } else if (state.hadInertAttribute) {
      state.element.setAttribute("inert", "");
    } else {
      state.element.removeAttribute("inert");
    }
  }
}

export function Dialog({
  children,
  className,
  description,
  initialFocusRef,
  onClose,
  open,
  role = "dialog",
  title,
  triggerRef
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setPortalHost(null);
      return;
    }

    const host = document.createElement("div");
    host.dataset.fairplayDialogPortal = "";
    document.body.append(host);
    setPortalHost(host);

    return () => {
      host.remove();
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!open || !portalHost || !dialog) {
      return;
    }

    restoreFocusRef.current =
      triggerRef?.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    const backgroundStates = isolateBackground(portalHost);
    const requestedInitialFocus = initialFocusRef?.current;
    const initialFocus =
      requestedInitialFocus && dialog.contains(requestedInitialFocus)
        ? requestedInitialFocus
        : focusableElements(dialog)[0] ?? dialog;
    initialFocus.focus();

    return () => {
      restoreBackground(backgroundStates);
      restoreFocusRef.current?.focus();
      restoreFocusRef.current = null;
    };
  }, [initialFocusRef, open, portalHost, triggerRef]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusable = focusableElements(dialog);
    event.preventDefault();

    if (focusable.length === 0) {
      dialog.focus();
      return;
    }

    const currentIndex = focusable.indexOf(
      document.activeElement as HTMLElement
    );
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? focusable.length - 1
        : currentIndex - 1
      : currentIndex < 0 || currentIndex === focusable.length - 1
        ? 0
        : currentIndex + 1;

    focusable[nextIndex]?.focus();
  }

  if (!open || !portalHost) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-fp-ink/35 p-4">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={[
          "grid w-full max-w-sm gap-4 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-elevated)]",
          className
        ]
          .filter(Boolean)
          .join(" ")}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role={role}
        tabIndex={-1}
      >
        <div className="grid gap-2">
          <h2 className="text-[18px] font-bold text-fp-ink" id={titleId}>
            {title}
          </h2>
          <p
            className="text-[14px] leading-6 text-fp-muted-ink"
            id={descriptionId}
          >
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>,
    portalHost
  );
}

export function AlertDialog(props: Omit<DialogProps, "role">) {
  return <Dialog {...props} role="alertdialog" />;
}
