"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";

type SettingsPanelProps = {
  household: HouseholdSummary;
  selectedPersona: PersonaSummary;
};

export function SettingsPanel({ household, selectedPersona }: SettingsPanelProps) {
  const router = useRouter();
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [preferenceAction, setPreferenceAction] = useState<
    "restart-course" | "show-welcome" | null
  >(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLElement>(null);
  const switchTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    if (showSwitchConfirm) {
      content.setAttribute("aria-hidden", "true");
      content.setAttribute("inert", "");
      continueButtonRef.current?.focus();
      return () => {
        content.removeAttribute("aria-hidden");
        content.removeAttribute("inert");
      };
    }

    content.removeAttribute("aria-hidden");
    content.removeAttribute("inert");
  }, [showSwitchConfirm]);

  async function logout() {
    setLoggingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("logout");
      }

      router.replace("/login");
    } catch {
      setError("Unable to log out right now. Please try again.");
      setLoggingOut(false);
    }
  }

  async function restartCrashCourse() {
    setPreferenceAction("restart-course");
    setActionStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/preferences/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crashCourseCurrentStep: 0,
          crashCourseSkippedAt: null,
          crashCourseCompletedAt: null,
          crashCourseReplayRequestedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("restart-course");
      }

      router.push("/app/crash-course");
      router.refresh();
    } catch {
      setError("Unable to restart the crash course right now. Please try again.");
    } finally {
      setPreferenceAction(null);
    }
  }

  async function showWelcomeAgain() {
    setPreferenceAction("show-welcome");
    setActionStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/preferences/welcome/replay", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("show-welcome");
      }

      setActionStatus("Welcome will show again across the app.");
      router.refresh();
    } catch {
      setError("Unable to show the welcome again right now. Please try again.");
    } finally {
      setPreferenceAction(null);
    }
  }

  function closeSwitchConfirm() {
    setShowSwitchConfirm(false);
    window.requestAnimationFrame(() => {
      switchTriggerRef.current?.focus();
    });
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSwitchConfirm();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      ) ?? []
    ).filter((element) => !element.hasAttribute("disabled"));

    if (focusableElements.length === 0) {
      return;
    }

    event.preventDefault();

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.shiftKey
      ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
      : (currentIndex + 1) % focusableElements.length;

    focusableElements[nextIndex]?.focus();
  }

  return (
    <>
      <section className="grid gap-5" ref={contentRef}>
        <div className="grid gap-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
            Settings
          </p>
          <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
            Household settings
          </h1>
        </div>

        {error ? (
          <p
            className="rounded-[8px] border border-fp-danger/40 bg-white px-3 py-2 text-[14px] leading-5 text-fp-danger"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {actionStatus ? (
          <p
            className="rounded-[8px] border border-fp-line bg-white px-3 py-2 text-[14px] font-semibold leading-5 text-fp-muted-ink"
            role="status"
          >
            {actionStatus}
          </p>
        ) : null}

        <section className="rounded-[8px] border border-fp-line bg-white p-4">
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Household
          </h2>
          <dl className="mt-3 grid gap-3 text-[14px] leading-5">
            <div className="flex items-center justify-between gap-3">
              <dt className="font-medium text-fp-muted-ink">Display name</dt>
              <dd className="text-right font-semibold text-fp-ink">
                {household.name}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-medium text-fp-muted-ink">Active persona</dt>
              <dd className="text-right font-semibold text-fp-ink">
                {selectedPersona.displayName}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[8px] border border-fp-line bg-white p-4">
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Persona
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Switching changes the active view for this session.
          </p>
          <button
            className="mt-4 min-h-11 rounded-[8px] border border-fp-line bg-fp-surface px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
            onClick={() => setShowSwitchConfirm(true)}
            ref={switchTriggerRef}
            type="button"
          >
            Switch persona
          </button>
        </section>

        <section className="rounded-[8px] border border-fp-line bg-white p-4">
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Guided start
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Replay the welcome splash or start the crash course from the first
            lesson for the active persona.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-fp-surface px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={preferenceAction !== null}
              onClick={() => void restartCrashCourse()}
              type="button"
            >
              {preferenceAction === "restart-course"
                ? "Restarting..."
                : "Restart crash course"}
            </button>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-fp-surface px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={preferenceAction !== null}
              onClick={() => void showWelcomeAgain()}
              type="button"
            >
              {preferenceAction === "show-welcome"
                ? "Showing welcome..."
                : "Show welcome again"}
            </button>
          </div>
        </section>

        <section className="rounded-[8px] border border-fp-line bg-white p-4">
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Data controls
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Export, deletion, household exit, and access revocation controls are
            planned after v1 privacy review.
          </p>
        </section>

        <button
          className="min-h-11 rounded-[8px] border border-fp-danger/40 bg-white px-4 text-[14px] font-semibold text-fp-danger outline-none focus:ring-2 focus:ring-fp-danger/25 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loggingOut}
          onClick={() => void logout()}
          type="button"
        >
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </section>

      {showSwitchConfirm ? (
        <div
          aria-describedby="switch-persona-description"
          aria-labelledby="switch-persona-title"
          aria-modal="true"
          className="fixed inset-0 z-20 grid place-items-center bg-fp-ink/35 px-4"
          onKeyDown={handleDialogKeyDown}
          ref={dialogRef}
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-[8px] border border-fp-line bg-white p-4 shadow-soft">
            <h2
              className="text-[17px] font-bold leading-6 text-fp-ink"
              id="switch-persona-title"
            >
              Switch active persona?
            </h2>
            <p
              className="mt-2 text-[14px] leading-5 text-fp-muted-ink"
              id="switch-persona-description"
            >
              You will choose Alex or Max again before returning to the app.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                className="min-h-11 flex-1 rounded-[8px] bg-fp-ink px-4 text-[14px] font-semibold text-white outline-none focus:ring-2 focus:ring-fp-ink/30"
                onClick={() => router.push("/choose-persona?next=/app/home")}
                ref={continueButtonRef}
                type="button"
              >
                Continue
              </button>
              <button
                className="min-h-11 flex-1 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
                onClick={closeSwitchConfirm}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
