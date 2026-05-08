"use client";

import Link from "next/link";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useRouter } from "next/navigation";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import {
  LITTLE_ALEX_SKIN_TONES,
  LITTLE_ALEX_SKIN_TONE_COLORS
} from "@/contracts/little-alex";
import {
  type LittleAlexGenderPresentation,
  type LittleAlexPreferences,
  type LittleAlexSkinTone
} from "@/contracts/preferences";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import {
  completeGuidePractice,
  useGuidePracticeRequest,
  useGuidePracticeReset
} from "@/components/guide/guide-practice";
import { PracticeActionGuidance } from "@/components/guide/practice-action-guidance";
import { useTheme, type ResolvedTheme } from "@/components/theme/theme-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DecorativeBackgroundLayer } from "@/components/visuals/fairplay-visuals";

type SettingsPanelProps = {
  household: HouseholdSummary;
  littleAlexPreferences: LittleAlexPreferences;
  selectedPersona: PersonaSummary;
};

const overrideThemeOptions: Array<{ label: string; value: ResolvedTheme }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" }
];

const littleAlexGenderOptions: Array<{
  label: string;
  value: LittleAlexGenderPresentation;
}> = [
  { label: "Neutral", value: "neutral" },
  { label: "Masculine", value: "masculine" },
  { label: "Feminine", value: "feminine" }
];

const littleAlexSkinOptions: Array<{
  label: string;
  swatch: string;
  value: LittleAlexSkinTone;
}> = LITTLE_ALEX_SKIN_TONES.map((value, index) => ({
  label: `Tone ${index + 1}`,
  swatch: LITTLE_ALEX_SKIN_TONE_COLORS[value],
  value
}));

const settingsPreferencesBackground =
  "/assets/fairplay/generated-ui/backgrounds/settings-preferences.png";

export function SettingsPanel({
  household,
  littleAlexPreferences,
  selectedPersona
}: SettingsPanelProps) {
  const router = useRouter();
  const { mode: themeMode, resolvedTheme, setMode: setThemeMode } = useTheme();
  const [littleAlexDraft, setLittleAlexDraft] = useState({
    genderPresentation: littleAlexPreferences.genderPresentation,
    chatPhrase: littleAlexPreferences.chatPhrase,
    skinTone: littleAlexPreferences.skinTone
  });
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingLittleAlex, setSavingLittleAlex] = useState(false);
  const [preferenceAction, setPreferenceAction] = useState<
    "restart-course" | "show-welcome" | null
  >(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [dummyPersonaConfirmOpen, setDummyPersonaConfirmOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLElement>(null);
  const switchTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const openSettingsPractice = useCallback(() => {
    setPracticeOpen(true);
  }, []);
  const resetSettingsPractice = useCallback(() => {
    setPracticeOpen(false);
    setDummyPersonaConfirmOpen(false);
  }, []);

  useGuidePracticeRequest("settings-practice-start", openSettingsPractice);
  useGuidePracticeReset("settings-practice-start", resetSettingsPractice);

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
      setError("Unable to restart Theory right now. Please try again.");
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

  function handleSystemThemeToggle() {
    setThemeMode(themeMode === "system" ? resolvedTheme : "system");
    completeGuidePractice("settings-appearance");
  }

  function handleThemeOverrideChange(nextMode: ResolvedTheme) {
    setThemeMode(nextMode);
    completeGuidePractice("settings-appearance");
  }

  async function saveLittleAlexPreferences() {
    setSavingLittleAlex(true);
    setActionStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/preferences/little-alex", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(littleAlexDraft)
      });

      if (!response.ok) {
        throw new Error("little-alex");
      }

      const saved = (await response.json()) as LittleAlexPreferences;
      setLittleAlexDraft({
        genderPresentation: saved.genderPresentation,
        chatPhrase: saved.chatPhrase,
        skinTone: saved.skinTone
      });
      setActionStatus(`Little Alex updated for ${selectedPersona.displayName}.`);
      router.refresh();
    } catch {
      setError("Unable to update Little Alex right now. Please try again.");
    } finally {
      setSavingLittleAlex(false);
    }
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
        <div
          className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
          data-guide-id="settings-overview"
          data-testid="settings-preferences-visual"
        >
          <DecorativeBackgroundLayer
            className="opacity-50 [mask-image:linear-gradient(90deg,black_0%,rgba(0,0,0,0.72)_48%,rgba(0,0,0,0.24)_100%)]"
            src={settingsPreferencesBackground}
            testId="settings-preferences-background"
            washClassName="fp-page-hero-wash"
          />
          <div className="fp-generated-surface-wash relative z-10 grid gap-2 p-4 backdrop-blur-[1px]">
            <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
              Settings
            </h1>
            <div className="mt-2">
              <FeatureGuideLauncher
                guide={FEATURE_GUIDES.settings}
                showDescription={false}
              />
            </div>
          </div>
        </div>

        {error ? (
          <p
            className="rounded-[8px] border border-fp-danger/40 bg-[var(--fp-surface-strong)] px-3 py-2 text-[14px] leading-5 text-fp-danger"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {actionStatus ? (
          <p
            className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 py-2 text-[14px] font-semibold leading-5 text-fp-muted-ink"
            role="status"
          >
            {actionStatus}
          </p>
        ) : null}

        <section className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4">
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

        <section
          className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4"
          data-guide-id="settings-appearance"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-1">
              <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
                Appearance
              </h2>
              <p className="text-[14px] leading-5 text-fp-muted-ink">
                {themeMode === "system"
                  ? `Following your system, currently ${resolvedTheme}.`
                  : `Using ${themeMode} mode on this device.`}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-center">
              <button
                aria-checked={themeMode === "system"}
                className="inline-flex min-h-11 items-center justify-between gap-3 rounded-[8px] border border-fp-line bg-fp-surface px-3 text-left text-[14px] font-semibold text-fp-ink outline-none transition focus:ring-2 focus:ring-fp-ink/25"
                onClick={handleSystemThemeToggle}
                role="switch"
                type="button"
              >
                <span>Follow system settings</span>
                <span
                  aria-hidden="true"
                  className={[
                    "relative h-6 w-11 rounded-full border border-fp-line transition",
                    themeMode === "system"
                      ? "bg-fp-primary"
                      : "bg-[var(--fp-surface-muted)]"
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-1 h-4 w-4 rounded-full bg-fp-on-primary shadow-[var(--fp-shadow-soft)] transition",
                      themeMode === "system" ? "left-6" : "left-1 bg-fp-ink"
                    ].join(" ")}
                  />
                </span>
              </button>
              <div
                aria-label="Theme override"
                className="inline-flex max-w-full gap-1 overflow-hidden rounded border border-[var(--fp-line)] bg-[var(--fp-surface)] p-1"
                role="group"
              >
                {overrideThemeOptions.map((option) => {
                  const isSelected =
                    themeMode !== "system" && option.value === themeMode;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={[
                        "min-h-9 min-w-16 rounded px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] disabled:cursor-not-allowed disabled:opacity-55",
                        isSelected
                          ? "bg-fp-primary text-fp-on-primary shadow-[var(--fp-shadow-soft)]"
                          : "text-[var(--fp-muted)] hover:bg-[var(--fp-surface-strong)] hover:text-[var(--fp-ink)]"
                      ].join(" ")}
                      disabled={themeMode === "system"}
                      key={option.value}
                      onClick={() => handleThemeOverrideChange(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4"
          data-guide-id="settings-persona"
        >
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Persona
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Switch the active view for this session.
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

        <section className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4">
          <div className="grid gap-4">
            <div className="grid gap-1">
              <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
                Little Alex
              </h2>
              <p className="text-[14px] leading-5 text-fp-muted-ink">
                Customize assistant for {selectedPersona.displayName}.
              </p>
            </div>

            <div className="grid gap-2">
              <span className="text-[13px] font-semibold text-fp-muted-ink">
                Gender presentation
              </span>
              <SegmentedControl
                ariaLabel="Little Alex gender presentation"
                className="justify-self-start"
                onChange={(genderPresentation) =>
                  setLittleAlexDraft((current) => ({
                    ...current,
                    genderPresentation
                  }))
                }
                options={littleAlexGenderOptions}
                value={littleAlexDraft.genderPresentation}
              />
            </div>

            <label
              className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink"
              htmlFor="little-alex-chat-phrase"
            >
              Little Alex chat bubble phrase
              <input
                aria-label="Little Alex chat bubble phrase"
                className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
                id="little-alex-chat-phrase"
                maxLength={30}
                onChange={(event) =>
                  setLittleAlexDraft((current) => ({
                    ...current,
                    chatPhrase: event.target.value
                  }))
                }
                value={littleAlexDraft.chatPhrase}
              />
              <span className="text-[12px] font-semibold text-fp-muted-ink">
                {littleAlexDraft.chatPhrase.length}/30
              </span>
            </label>

            <div className="grid gap-2">
              <span className="text-[13px] font-semibold text-fp-muted-ink">
                Skin tone
              </span>
              <div
                aria-label="Little Alex skin tone"
                className="flex flex-wrap gap-2"
                role="group"
              >
                {littleAlexSkinOptions.map((option) => {
                  const selected = option.value === littleAlexDraft.skinTone;

                  return (
                    <button
                      aria-pressed={selected}
                      className={[
                        "inline-flex min-h-10 items-center gap-2 rounded-[8px] border px-3 text-[13px] font-bold outline-none focus:ring-2 focus:ring-fp-ink/25",
                        selected
                          ? "border-fp-ink bg-fp-primary text-fp-on-primary"
                          : "border-fp-line bg-[var(--fp-surface)] text-fp-ink"
                      ].join(" ")}
                      key={option.value}
                      onClick={() =>
                        setLittleAlexDraft((current) => ({
                          ...current,
                          skinTone: option.value
                        }))
                      }
                      type="button"
                    >
                      <span
                        aria-hidden
                        className="h-4 w-4 rounded-full border border-fp-ink/30"
                        style={{ background: option.swatch }}
                      />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="min-h-11 justify-self-start rounded-[8px] bg-fp-primary px-4 text-[14px] font-semibold text-fp-on-primary outline-none focus:ring-2 focus:ring-fp-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={
                savingLittleAlex || littleAlexDraft.chatPhrase.trim().length === 0
              }
              onClick={() => void saveLittleAlexPreferences()}
              type="button"
            >
              {savingLittleAlex ? "Saving Little Alex..." : "Save Little Alex"}
            </button>
          </div>
        </section>

        <section
          className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4"
          data-guide-id="settings-guided-start"
        >
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Guided start
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Replay welcome or restart Theory.
          </p>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Feature guides stay on their pages.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-fp-surface px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={preferenceAction !== null}
              onClick={() => void restartCrashCourse()}
              type="button"
            >
              {preferenceAction === "restart-course"
                ? "Restarting..."
                : "Restart Theory"}
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
            <Link
              className="flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-fp-surface px-4 text-center text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
              href="/app/distribute"
            >
              Open distribute
            </Link>
          </div>
          {practiceOpen ? (
            <SettingsPracticeWorkflow
              onOpenPersonaConfirm={() => setDummyPersonaConfirmOpen(true)}
            />
          ) : null}
        </section>

        <section className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4">
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Data controls
          </h2>
          <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
            Export, deletion, and access controls are planned after v1 privacy
            review.
          </p>
        </section>

        <button
          className="min-h-11 rounded-[8px] border border-fp-danger/40 bg-[var(--fp-surface-strong)] px-4 text-[14px] font-semibold text-fp-danger outline-none focus:ring-2 focus:ring-fp-danger/25 disabled:cursor-not-allowed disabled:opacity-70"
          data-guide-id="settings-logout"
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
          <div className="w-full max-w-sm rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 shadow-soft">
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
                className="min-h-11 flex-1 rounded-[8px] bg-fp-primary px-4 text-[14px] font-semibold text-fp-on-primary outline-none focus:ring-2 focus:ring-fp-primary/30"
                onClick={() => router.push("/choose-persona?next=/app/distribute")}
                ref={continueButtonRef}
                type="button"
              >
                Continue
              </button>
              <button
                className="min-h-11 flex-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
                onClick={closeSwitchConfirm}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {dummyPersonaConfirmOpen ? (
        <div
          aria-labelledby="dummy-persona-confirm-title"
          aria-modal="true"
          className="fixed inset-0 z-[65] grid place-items-center bg-fp-ink/35 px-4"
          role="dialog"
        >
          <div className="grid w-full max-w-sm gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 text-fp-ink shadow-soft">
            <h2
              className="text-[17px] font-bold leading-6 text-fp-ink"
              id="dummy-persona-confirm-title"
            >
              Dummy persona switch confirmation
            </h2>
            <p className="text-[14px] leading-5 text-fp-muted-ink">
              This is a local practice confirmation. It will not leave Settings.
            </p>
            <PracticeActionGuidance
              actionLabel="Stay in settings"
              wrapperClassName="mt-1"
            >
              <button
                className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-4 text-[14px] font-semibold text-fp-ink"
                onClick={() => setDummyPersonaConfirmOpen(false)}
                type="button"
              >
                Stay in settings
              </button>
            </PracticeActionGuidance>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SettingsPracticeWorkflow({
  onOpenPersonaConfirm
}: {
  onOpenPersonaConfirm: () => void;
}) {
  const [appearanceMode, setAppearanceMode] = useState<"system" | "light" | "dark">(
    "system"
  );
  const [appearanceChanged, setAppearanceChanged] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [personaConfirmOpened, setPersonaConfirmOpened] = useState(false);
  const [learningHubLocated, setLearningHubLocated] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function mark(eventId: string, message: string) {
    setStatus(message);
    completeGuidePractice(eventId);
  }

  return (
    <section
      aria-label="Dummy Settings practice"
      className="relative z-[60] mt-4 grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-fp-ink shadow-[var(--fp-shadow-elevated)]"
      data-guide-practice-surface
    >
      <div className="grid gap-1">
        <h3 className="text-[16px] font-bold text-fp-ink">
          Dummy Settings practice
        </h3>
        <p className="text-[13px] leading-5 text-fp-muted-ink">
          Practice settings actions locally without changing household data.
        </p>
      </div>
      <PracticeActionGuidance
        actionLabel="Choose a dummy appearance mode"
        active={!appearanceChanged}
        kind="action"
      >
        <label className="grid gap-1 text-[13px] font-semibold text-fp-muted-ink">
          Dummy appearance mode
          <select
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[14px] text-fp-ink"
            onChange={(event) => {
              const value = event.target.value as "system" | "light" | "dark";
              setAppearanceMode(value);
              setAppearanceChanged(true);
              mark(
                "settings-appearance-mode",
                `Dummy appearance mode changed to ${label(value)}.`
              );
            }}
            value={appearanceMode}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </PracticeActionGuidance>
      <div className="flex flex-wrap items-start gap-2">
        <PracticeActionGuidance
          actionLabel="Check dummy welcome replay"
          active={appearanceChanged && !welcomeChecked}
        >
          <button
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
            onClick={() => {
              setWelcomeChecked(true);
              mark("settings-welcome-replay", "Dummy welcome replay checked.");
            }}
            type="button"
          >
            Check dummy welcome replay
          </button>
        </PracticeActionGuidance>
        <PracticeActionGuidance
          actionLabel="Open dummy persona confirmation"
          active={welcomeChecked && !personaConfirmOpened}
        >
          <button
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
            onClick={() => {
              setPersonaConfirmOpened(true);
              onOpenPersonaConfirm();
              mark(
                "settings-persona-confirm",
                "Dummy persona confirmation opened."
              );
            }}
            type="button"
          >
            Open dummy persona confirmation
          </button>
        </PracticeActionGuidance>
        <PracticeActionGuidance
          actionLabel="Locate dummy learning hub"
          active={personaConfirmOpened && !learningHubLocated}
        >
          <button
            className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink"
            onClick={() => {
              setLearningHubLocated(true);
              mark("settings-learning-hub", "Dummy learning hub located.");
            }}
            type="button"
          >
            Locate dummy learning hub
          </button>
        </PracticeActionGuidance>
      </div>
      {status ? (
        <p
          className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3 text-[13px] font-semibold text-fp-muted-ink"
          role="status"
        >
          {status}
        </p>
      ) : null}
    </section>
  );
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
