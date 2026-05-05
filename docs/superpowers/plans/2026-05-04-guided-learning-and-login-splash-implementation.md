# Guided Learning and Login Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-triggered guided feature tours, practical App Guide 101/201/301 learning surfaces, character-enhanced crash-course lessons, and a warm animated login splash.

**Architecture:** Create a reusable guide layer that reads declarative feature-tour content and highlights existing UI via stable `data-guide-id` markers. Keep methodology learning in the crash course, practical product learning in Home/feature tours, and first-impression visual polish in the auth shell. Split work by file ownership so workers can build in parallel without overwriting each other.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, Vitest/Testing Library, Playwright, existing Fairplay visual SVG assets and CSS motion tokens.

---

## File Ownership Map

- Guide foundation:
  - Create `src/components/guide/guide-content.ts`
  - Create `src/components/guide/guided-tour.tsx`
  - Create `src/components/guide/feature-guide-launcher.tsx`
  - Create `src/components/guide/guided-tour.test.tsx`
  - Create `src/components/guide/feature-guide-launcher.test.tsx`
- Home, welcome, and settings:
  - Modify `src/app/app/home/page.tsx`
  - Modify `src/components/welcome/persistent-welcome.tsx`
  - Modify `src/components/welcome/persistent-welcome.test.tsx`
  - Modify `src/components/settings/settings-panel.tsx`
  - Modify `src/components/settings/settings-panel.test.tsx`
  - Modify `src/components/app-shell/app-shell.test.tsx`
- Feature tour markers and launchers:
  - Modify `src/components/responsibilities/responsibility-load-map.tsx`
  - Modify `src/components/responsibilities/responsibility-load-map.test.tsx`
  - Modify `src/components/library/card-library.tsx`
  - Modify `src/components/library/card-library.test.tsx`
  - Modify `src/components/radar/radar-board.tsx`
  - Modify `src/components/radar/radar-board.test.tsx`
  - Modify `src/components/check-ins/check-in-flow.tsx`
  - Modify `src/components/check-ins/check-in-flow.test.tsx`
- Crash-course scenes:
  - Create `src/components/crash-course/crash-course-scene.tsx`
  - Create `src/components/crash-course/crash-course-scene.test.tsx`
  - Modify `src/components/crash-course/crash-course-content.ts`
  - Modify `src/components/crash-course/crash-course-flow.tsx`
  - Modify `src/components/crash-course/crash-course-flow.test.tsx`
- Login splash:
  - Create `src/components/auth/login-splash-illustration.tsx`
  - Create `src/components/auth/login-splash-illustration.test.tsx`
  - Modify `src/components/auth/auth-page-shell.tsx`
  - Modify `src/components/auth/login-page-client.tsx`
  - Modify `src/components/auth/auth-forms.test.tsx`
  - Modify `src/app/globals.css`
- Verification and docs:
  - Create task reports under `docs/implementation/`
  - Modify `e2e/auth-onboarding.spec.ts`
  - Create `e2e/guided-learning.spec.ts`

## Parallelization Strategy

- Batch A can run in parallel:
  - Task 1 guide foundation.
  - Task 4 login splash.
  - Task 5 crash-course scenes.
- Batch B starts after Task 1 lands:
  - Task 2 Home/welcome/settings wiring.
  - Task 3 feature tour markers and launchers.
- Controller owns final integration, docs, full verification, PR, and merge.

Every implementation worker must write a report in `docs/implementation/` with:

```markdown
# Task N: <Name>

## Expectations

## Outputs

## Verification

## Challenges
```

## Task 1: Guide Foundation

**Files:**
- Create: `src/components/guide/guide-content.ts`
- Create: `src/components/guide/guided-tour.tsx`
- Create: `src/components/guide/feature-guide-launcher.tsx`
- Create: `src/components/guide/guided-tour.test.tsx`
- Create: `src/components/guide/feature-guide-launcher.test.tsx`
- Create: `docs/implementation/2026-05-04-task-11-guide-foundation.md`

- [ ] **Step 1: Write failing guided-tour tests**

Create `src/components/guide/guided-tour.test.tsx` with tests for start state, next/back, skip, done, missing target fallback, Escape exit, and blocked background interaction.

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedTour, type GuideStep } from "./guided-tour";

const steps: GuideStep[] = [
  {
    id: "first",
    title: "This is the Load Map",
    body: "Cards in play live here so the household can see ownership.",
    targetId: "load-map-board"
  },
  {
    id: "second",
    title: "Move cards deliberately",
    body: "Use drag and drop or the move menu when the lane decision changes.",
    targetId: "move-menu"
  }
];

describe("GuidedTour", () => {
  it("shows a coach bubble, highlights the active target, and blocks background clicks", () => {
    const onBackgroundClick = vi.fn();
    render(
      <div>
        <button data-guide-id="load-map-board" onClick={onBackgroundClick}>
          Board target
        </button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    expect(screen.getByRole("dialog", { name: "Load Map guide" })).toBeVisible();
    expect(screen.getByText("This is the Load Map")).toBeVisible();
    expect(screen.getByText("Step 1 of 2")).toBeVisible();

    fireEvent.click(screen.getByLabelText("Guided tour backdrop"));

    expect(onBackgroundClick).not.toHaveBeenCalled();
  });

  it("moves forward and backward through steps", () => {
    render(<GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Move cards deliberately")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("This is the Load Map")).toBeVisible();
  });

  it("exits through skip, done, and Escape", () => {
    const onExit = vi.fn();
    const { rerender } = render(
      <GuidedTour featureName="Load Map" onExit={onExit} steps={steps} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onExit).toHaveBeenCalledTimes(1);

    rerender(<GuidedTour featureName="Load Map" onExit={onExit} steps={[steps[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onExit).toHaveBeenCalledTimes(2);

    rerender(<GuidedTour featureName="Load Map" onExit={onExit} steps={steps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(3);
  });

  it("uses a friendly fallback when a target is missing", () => {
    render(
      <GuidedTour
        featureName="Library"
        onExit={vi.fn()}
        steps={[
          {
            id: "missing",
            title: "Search cards",
            body: "Use search to find a source card.",
            targetId: "not-present"
          }
        ]}
      />
    );

    expect(screen.getByText("Search cards")).toBeVisible();
    expect(
      screen.getByText("This part of the page is not visible right now.")
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Write failing guide launcher tests**

Create `src/components/guide/feature-guide-launcher.test.tsx`.

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEATURE_GUIDES } from "./guide-content";
import { FeatureGuideLauncher } from "./feature-guide-launcher";

const queryValue = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(queryValue.value)
}));

describe("FeatureGuideLauncher", () => {
  beforeEach(() => {
    queryValue.value = "";
  });

  it("starts a user-triggered feature guide with a helper character", () => {
    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.loadMap} />);

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));

    expect(screen.getByRole("dialog", { name: "Load Map guide" })).toBeVisible();
    expect(screen.getByAltText("")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not auto-start before the user taps the guide", () => {
    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.library} />);

    expect(screen.queryByRole("dialog", { name: "Library guide" })).not.toBeInTheDocument();
  });

  it("starts from a guide query only when the user arrived from a guide link", () => {
    queryValue.value = "guide=library";

    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.library} />);

    expect(screen.getByRole("dialog", { name: "Library guide" })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run tests and verify red**

Run:

```bash
npx vitest run src/components/guide/guided-tour.test.tsx src/components/guide/feature-guide-launcher.test.tsx
```

Expected: FAIL because guide components do not exist.

- [ ] **Step 4: Implement guide content**

Create `src/components/guide/guide-content.ts`.

```ts
export type FeatureGuideId =
  | "loadMap"
  | "library"
  | "radar"
  | "checkIns"
  | "settings";

export type GuideStep = {
  id: string;
  title: string;
  body: string;
  targetId: string;
};

export type FeatureGuide = {
  id: FeatureGuideId;
  title: string;
  description: string;
  steps: GuideStep[];
};

export const FEATURE_GUIDES: Record<FeatureGuideId, FeatureGuide> = {
  loadMap: {
    id: "loadMap",
    title: "Load Map",
    description: "Learn lanes, in-play cards, owner lanes, filters, and moving cards.",
    steps: [
      {
        id: "board",
        title: "The Load Map is your operating board",
        body: "Cards in play are active household responsibilities. The board makes ownership visible without turning it into a score.",
        targetId: "load-map-board"
      },
      {
        id: "lanes",
        title: "Lanes describe the card's current state",
        body: "Cards of Concern need attention, owner lanes show accountable ownership, Not in Play is reserve, and Trimmed is intentionally out.",
        targetId: "load-map-lanes"
      },
      {
        id: "move",
        title: "Move cards when the household decision changes",
        body: "Drag cards or use the move menu. Moving a card should mean the lane now reflects the real agreement.",
        targetId: "load-map-move"
      },
      {
        id: "filters",
        title: "Filters help you inspect the system",
        body: "Use owner, status, cadence, hidden effort, radar, and search filters to understand the current load.",
        targetId: "load-map-filters"
      }
    ]
  },
  library: {
    id: "library",
    title: "Library",
    description: "Learn search, labels, source cards, and putting a card in play.",
    steps: [
      {
        id: "search",
        title: "Search the source deck",
        body: "The library is the reserve deck. Search and labels help you find responsibilities that may matter to your household.",
        targetId: "library-search"
      },
      {
        id: "labels",
        title: "Labels group related work",
        body: "Labels are not assignments. They are ways to browse kinds of household work before deciding what is in play.",
        targetId: "library-labels"
      },
      {
        id: "put-in-play",
        title: "Putting a card in play creates a responsibility",
        body: "In play means this source card becomes part of your household operating system and appears on the Load Map.",
        targetId: "library-put-in-play"
      }
    ]
  },
  radar: {
    id: "radar",
    title: "Radar",
    description: "Learn private drafts, publishing, deferring, and resolving unclear work.",
    steps: [
      {
        id: "draft",
        title: "Radar starts with a neutral topic",
        body: "Use Radar for blockers, unclear standards, or overloaded areas. It is a signal board, not a blame board.",
        targetId: "radar-create"
      },
      {
        id: "visibility",
        title: "Visibility controls when a topic is shared",
        body: "You can keep a draft private until it is ready, then publish it to shared household space or a check-in.",
        targetId: "radar-visibility"
      },
      {
        id: "actions",
        title: "Resolve, defer, or schedule",
        body: "Radar topics should move toward a calm next step: decide now, defer with context, schedule, or resolve.",
        targetId: "radar-actions"
      }
    ]
  },
  checkIns: {
    id: "checkIns",
    title: "Check-ins",
    description: "Learn agenda preview, decisions, deferrals, and completion summaries.",
    steps: [
      {
        id: "agenda",
        title: "Preview the agenda",
        body: "Check-ins turn Radar topics into a calm list of things to discuss, skip, defer, or decide.",
        targetId: "check-in-agenda"
      },
      {
        id: "decision",
        title: "Record the decision, not the argument",
        body: "Capture what changed, who owns the outcome, and when the household should review it.",
        targetId: "check-in-decision"
      },
      {
        id: "complete",
        title: "Complete with a clear next step",
        body: "Completion summarizes decisions and keeps the board from becoming a memory test.",
        targetId: "check-in-complete"
      }
    ]
  },
  settings: {
    id: "settings",
    title: "Settings",
    description: "Learn replay controls, persona switching, and session actions.",
    steps: [
      {
        id: "persona",
        title: "Persona controls the current viewpoint",
        body: "Switching persona changes which partner is active for this session.",
        targetId: "settings-persona"
      },
      {
        id: "guided-start",
        title: "Replay learning whenever you need it",
        body: "Restart the crash course, show the welcome again, or open the app guide from here.",
        targetId: "settings-guided-start"
      },
      {
        id: "logout",
        title: "End the shared session",
        body: "Log out when you are done using the shared household account on this device.",
        targetId: "settings-logout"
      }
    ]
  }
};
```

- [ ] **Step 5: Implement `GuidedTour`**

Create `src/components/guide/guided-tour.tsx` as a client component. It should:

- Accept `{ featureName, steps, onExit }`.
- Query `[data-guide-id="<targetId>"]` for the active step.
- Render a fixed dimming backdrop with `aria-label="Guided tour backdrop"`.
- Render a highlight rectangle when the target exists.
- Render fallback text `This part of the page is not visible right now.` when missing.
- Trap practical interaction by overlaying the page and moving focus into the bubble.
- Support Escape to exit.

- [ ] **Step 6: Implement `FeatureGuideLauncher`**

Create `src/components/guide/feature-guide-launcher.tsx` as a client component that renders:

- A small helper mascot using `HelperMascot`.
- A `Learn this feature` button.
- Optional description text.
- `GuidedTour` only after the button is tapped.
- `GuidedTour` on initial render only when `useSearchParams().get("guide") === guide.id`, so Home can deep-link into a tour without first-time auto-start behavior.

- [ ] **Step 7: Verify green**

Run:

```bash
npx vitest run src/components/guide/guided-tour.test.tsx src/components/guide/feature-guide-launcher.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Write implementation report and commit**

Create `docs/implementation/2026-05-04-task-11-guide-foundation.md` with expectations, outputs, verification, and challenges.

Commit:

```bash
git add src/components/guide docs/implementation/2026-05-04-task-11-guide-foundation.md
git commit -m "feat: add guided tour foundation"
```

## Task 2: Home, Welcome, and Settings Learning Surfaces

**Depends on:** Task 1.

**Files:**
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/components/welcome/persistent-welcome.tsx`
- Modify: `src/components/welcome/persistent-welcome.test.tsx`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify: `src/components/settings/settings-panel.test.tsx`
- Modify: `src/components/app-shell/app-shell.test.tsx`
- Create: `docs/implementation/2026-05-04-task-12-home-settings-learning.md`

- [ ] **Step 1: Write failing Home shell tests**

Update `src/components/app-shell/app-shell.test.tsx` to assert:

```tsx
expect(screen.getByRole("heading", { name: "Learn Fairplay in layers" })).toBeVisible();
expect(screen.getByRole("link", { name: /Crash course/i })).toHaveAttribute("href", "/app/crash-course");
expect(screen.getByRole("link", { name: /App Guide 101/i })).toHaveAttribute("href", "/app/home#app-guide-101");
expect(screen.getByRole("link", { name: /Card library/i })).toHaveAttribute("href", "/app/library");
expect(screen.getAllByRole("link", { name: "Learn this feature" }).length).toBeGreaterThanOrEqual(1);
```

- [ ] **Step 2: Write failing welcome/settings tests**

Update welcome test to expect `App guide`, `Crash course`, and `Card library` links in the persistent welcome.

Update settings test to expect:

```tsx
expect(screen.getByRole("button", { name: "Restart crash course" })).toBeVisible();
expect(screen.getByRole("link", { name: "Open App Guide 101" })).toHaveAttribute("href", "/app/home#app-guide-101");
expect(screen.getByText("Replay feature tours from each feature page using Learn this feature.")).toBeVisible();
```

- [ ] **Step 3: Run tests and verify red**

Run:

```bash
npx vitest run src/components/app-shell/app-shell.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx
```

Expected: FAIL because the learning hub and revised links do not exist.

- [ ] **Step 4: Implement Home learning hub**

Modify `src/app/app/home/page.tsx` to:

- Replace the three generic cards with a learning hub.
- Include helper visuals using existing `HelperMascot`.
- Render `Crash course`, `App Guide 101`, and `Card library` actions.
- Render feature rows/cards for Load Map, Library, Radar, Check-ins, and Settings.
- For feature cards, use `Learn this feature` links with guide intent:
  - Load Map: `/app/load-map?guide=loadMap`
  - Library: `/app/library?guide=library`
  - Radar: `/app/radar?guide=radar`
  - Check-ins: `/app/check-ins/new?guide=checkIns`
  - Settings: `/app/settings?guide=settings`

- [ ] **Step 5: Update welcome links**

Modify `PersistentWelcome` so `welcomeLinks` are:

- `/app/crash-course` labeled `Crash course`.
- `/app/home#app-guide-101` labeled `App guide`.
- `/app/library` labeled `Card library`.

Update copy to say the welcome points to the methodology, product guide, and source deck.

- [ ] **Step 6: Update settings guided start**

Modify Settings guided section to include:

- Restart crash course button.
- Show welcome again button.
- Link to `Open App Guide 101`.
- Text: `Replay feature tours from each feature page using Learn this feature.`

Add `data-guide-id` markers:

- `settings-persona`
- `settings-guided-start`
- `settings-logout`

- [ ] **Step 7: Verify green**

Run:

```bash
npx vitest run src/components/app-shell/app-shell.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Write report and commit**

Create `docs/implementation/2026-05-04-task-12-home-settings-learning.md`.

Commit:

```bash
git add src/app/app/home/page.tsx src/components/welcome src/components/settings src/components/app-shell/app-shell.test.tsx docs/implementation/2026-05-04-task-12-home-settings-learning.md
git commit -m "feat: add home learning hub"
```

## Task 3: Feature Tour Markers and Launchers

**Depends on:** Task 1.

**Files:**
- Modify: `src/components/responsibilities/responsibility-load-map.tsx`
- Modify: `src/components/responsibilities/responsibility-load-map.test.tsx`
- Modify: `src/components/library/card-library.tsx`
- Modify: `src/components/library/card-library.test.tsx`
- Modify: `src/components/radar/radar-board.tsx`
- Modify: `src/components/radar/radar-board.test.tsx`
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/components/check-ins/check-in-flow.test.tsx`
- Create: `docs/implementation/2026-05-04-task-13-feature-tour-markers.md`

- [ ] **Step 1: Write failing tests for launch buttons and markers**

Add targeted assertions:

```tsx
expect(screen.getByRole("button", { name: "Learn this feature" })).toBeVisible();
expect(screen.getByTestId("load-map-board")).toHaveAttribute("data-guide-id", "load-map-board");
```

For Library:

```tsx
expect(screen.getByLabelText("Search cards")).toHaveAttribute("data-guide-id", "library-search");
expect(screen.getByRole("button", { name: /put Auto in play/i })).toHaveAttribute("data-guide-id", "library-put-in-play");
```

For Radar:

```tsx
expect(screen.getByRole("button", { name: "Learn this feature" })).toBeVisible();
expect(screen.getByLabelText("Topic")).toHaveAttribute("data-guide-id", "radar-create");
```

For Check-ins:

```tsx
expect(screen.getByRole("button", { name: "Learn this feature" })).toBeVisible();
expect(screen.getByLabelText("Decision summary")).toHaveAttribute("data-guide-id", "check-in-decision");
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
npx vitest run src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx
```

Expected: FAIL because guide launchers and data markers are missing.

- [ ] **Step 3: Add guide launchers**

Import `FeatureGuideLauncher` and `FEATURE_GUIDES` in each component:

- Load Map: `FEATURE_GUIDES.loadMap`
- Library: `FEATURE_GUIDES.library`
- Radar: `FEATURE_GUIDES.radar`
- Check-ins: `FEATURE_GUIDES.checkIns`

Place the launcher near the page heading or primary workflow entry, with helper character visible but not blocking work.

- [ ] **Step 4: Add stable `data-guide-id` markers**

Add markers matching Task 1 content:

- Load Map:
  - board wrapper: `data-guide-id="load-map-board"` and `data-testid="load-map-board"`
  - lane row/columns wrapper: `data-guide-id="load-map-lanes"`
  - first move menu button: `data-guide-id="load-map-move"`
  - filters panel: `data-guide-id="load-map-filters"`
- Library:
  - search input: `data-guide-id="library-search"`
  - label rail: `data-guide-id="library-labels"`
  - Put in play button: `data-guide-id="library-put-in-play"`
- Radar:
  - create form/topic input area: `data-guide-id="radar-create"`
  - visibility select: `data-guide-id="radar-visibility"`
  - action buttons area: `data-guide-id="radar-actions"`
- Check-ins:
  - agenda/current item area: `data-guide-id="check-in-agenda"`
  - decision form area: `data-guide-id="check-in-decision"`
  - complete button/summary area: `data-guide-id="check-in-complete"`

- [ ] **Step 5: Verify green**

Run:

```bash
npx vitest run src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Write report and commit**

Create `docs/implementation/2026-05-04-task-13-feature-tour-markers.md`.

Commit:

```bash
git add src/components/responsibilities src/components/library src/components/radar src/components/check-ins docs/implementation/2026-05-04-task-13-feature-tour-markers.md
git commit -m "feat: add feature tour entry points"
```

## Task 4: Login Splash Illustration

**Files:**
- Create: `src/components/auth/login-splash-illustration.tsx`
- Create: `src/components/auth/login-splash-illustration.test.tsx`
- Modify: `src/components/auth/auth-page-shell.tsx`
- Modify: `src/components/auth/login-page-client.tsx`
- Modify: `src/components/auth/auth-forms.test.tsx`
- Modify: `src/app/globals.css`
- Create: `docs/implementation/2026-05-04-task-14-login-splash.md`

- [ ] **Step 1: Write failing splash tests**

Create `src/components/auth/login-splash-illustration.test.tsx`.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginSplashIllustration } from "./login-splash-illustration";

describe("LoginSplashIllustration", () => {
  it("renders an accessible animated household garden scene", () => {
    render(<LoginSplashIllustration />);

    expect(
      screen.getByRole("img", { name: "Animated Fairplay household garden scene" })
    ).toBeVisible();
    expect(screen.getByTestId("login-splash-alex")).toHaveClass("fp-motion-persona-bob");
    expect(screen.getByTestId("login-splash-cloud")).toHaveClass("fp-motion-cloud-drift");
    expect(screen.getByTestId("login-splash-spark")).toHaveClass("fp-motion-radar-pulse");
  });
});
```

Update `src/components/auth/auth-forms.test.tsx` or add a login page client test to assert:

```tsx
expect(screen.getByRole("heading", { name: "Log in to Fairplay" })).toBeVisible();
expect(screen.getByRole("img", { name: "Animated Fairplay household garden scene" })).toBeVisible();
expect(screen.getByLabelText("Household username")).toBeVisible();
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx
```

Expected: FAIL because illustration does not exist.

- [ ] **Step 3: Implement illustration**

Create `LoginSplashIllustration` as original CSS/SVG-like JSX:

- wrapper `role="img"` and label `Animated Fairplay household garden scene`
- Alex and Max character blocks
- helper spark
- cloud and plant elements
- small household board
- no text inside the illustration

- [ ] **Step 4: Update auth shell**

Modify `AuthPageShell` to accept a `visual?: ReactNode` prop and a wider layout variant for pages that provide a visual. For login, use a two-column desktop layout and mobile-friendly stacked layout. Keep form labels and footer unchanged.

Modify `LoginPageClient` to pass `<LoginSplashIllustration />` and update summary copy to the calmer household rhythm direction.

- [ ] **Step 5: Add motion CSS**

Add to `src/app/globals.css`:

```css
@keyframes fp-cloud-drift {
  0% { transform: translateX(0); }
  50% { transform: translateX(8px); }
  100% { transform: translateX(0); }
}

@keyframes fp-leaf-sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg); }
}

.fp-motion-cloud-drift {
  animation: fp-cloud-drift 8s ease-in-out infinite;
}

.fp-motion-leaf-sway {
  animation: fp-leaf-sway 4s ease-in-out infinite;
}
```

Ensure existing reduced-motion media query includes these classes.

- [ ] **Step 6: Verify green**

Run:

```bash
npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Write report and commit**

Create `docs/implementation/2026-05-04-task-14-login-splash.md`.

Commit:

```bash
git add src/components/auth src/app/globals.css docs/implementation/2026-05-04-task-14-login-splash.md
git commit -m "feat: add animated login splash"
```

## Task 5: Crash Course Character Scenes

**Files:**
- Create: `src/components/crash-course/crash-course-scene.tsx`
- Create: `src/components/crash-course/crash-course-scene.test.tsx`
- Modify: `src/components/crash-course/crash-course-content.ts`
- Modify: `src/components/crash-course/crash-course-flow.tsx`
- Modify: `src/components/crash-course/crash-course-flow.test.tsx`
- Create: `docs/implementation/2026-05-04-task-15-crash-course-scenes.md`

- [ ] **Step 1: Write failing scene tests**

Create `src/components/crash-course/crash-course-scene.test.tsx`.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CrashCourseScene } from "./crash-course-scene";

describe("CrashCourseScene", () => {
  it("renders a balanced owner and helper scene", () => {
    render(<CrashCourseScene scene="owner-helper" />);

    expect(screen.getByRole("img", { name: "Owner and helper learning scene" })).toBeVisible();
    expect(screen.getByTestId("scene-alex")).toBeVisible();
    expect(screen.getByTestId("scene-max")).toBeVisible();
    expect(screen.getByTestId("scene-helper")).toBeVisible();
  });

  it("renders CPE as three connected stages", () => {
    render(<CrashCourseScene scene="cpe-path" />);

    expect(screen.getByText("Conception")).toBeVisible();
    expect(screen.getByText("Planning")).toBeVisible();
    expect(screen.getByText("Execution")).toBeVisible();
  });
});
```

Update `crash-course-flow.test.tsx`:

```tsx
render(<CrashCourseFlow currentStep={1} />);
expect(screen.getByRole("img", { name: "Owner and helper learning scene" })).toBeVisible();
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx
```

Expected: FAIL because scene component and lesson scene keys do not exist.

- [ ] **Step 3: Add scene keys to lessons**

Extend `CrashCourseLesson` with:

```ts
scene:
  | "not-chore"
  | "owner-helper"
  | "cpe-path"
  | "standards-note"
  | "board-lanes"
  | "active-deck"
  | "handoff"
  | "radar-check-in"
  | "dynamic-fair"
  | "repair";
```

Assign a scene to each existing lesson.

- [ ] **Step 4: Implement `CrashCourseScene`**

Use original, simple JSX illustration:

- Balanced Alex/Max dots/characters.
- Helper marker.
- Scene-specific signs or path labels where useful.
- `role="img"` with meaningful labels.
- Decorative nature/home shapes.
- No copied card art.

- [ ] **Step 5: Place scene in crash course layout**

Modify `CrashCourseFlow` so the scene appears beside the lesson intro on desktop and above lesson content on mobile. Keep text readable and controls stable.

- [ ] **Step 6: Verify green**

Run:

```bash
npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Write report and commit**

Create `docs/implementation/2026-05-04-task-15-crash-course-scenes.md`.

Commit:

```bash
git add src/components/crash-course docs/implementation/2026-05-04-task-15-crash-course-scenes.md
git commit -m "feat: add crash course scenes"
```

## Task 6: End-to-End Guided Learning Verification

**Depends on:** Tasks 1-5.

**Files:**
- Create: `e2e/guided-learning.spec.ts`
- Modify: `e2e/auth-onboarding.spec.ts`
- Create: `docs/implementation/2026-05-04-task-16-guided-learning-verification.md`

- [ ] **Step 1: Write Playwright guided-learning smoke**

Create `e2e/guided-learning.spec.ts` with a route-mocked test that:

- Opens `/app/home`.
- Confirms `Learn Fairplay in layers`.
- Clicks a `Learn this feature` control.
- Sees a guide dialog.
- Clicks `Next`.
- Clicks `Skip`.
- Confirms the guide closes.

- [ ] **Step 2: Update login visual smoke**

Update `e2e/auth-onboarding.spec.ts` login-related smoke to expect:

```ts
await expect(
  page.getByRole("img", { name: "Animated Fairplay household garden scene" })
).toBeVisible();
```

- [ ] **Step 3: Run focused e2e**

Run:

```bash
DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx playwright test e2e/guided-learning.spec.ts e2e/auth-onboarding.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run lint
npm run typecheck
DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm test
DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build
DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e
```

Expected: all pass.

- [ ] **Step 5: Write report and commit**

Create `docs/implementation/2026-05-04-task-16-guided-learning-verification.md`.

Commit:

```bash
git add e2e docs/implementation/2026-05-04-task-16-guided-learning-verification.md
git commit -m "test: add guided learning browser smoke"
```

## Task 7: PR, Vercel, Merge, and Local Main Alignment

**Files:**
- Modify or create: `docs/implementation/2026-05-04-task-17-guided-learning-pr-merge.md`

- [ ] **Step 1: Push branch**

Run:

```bash
git push -u origin codex/guided-learning-splash
```

- [ ] **Step 2: Open PR**

Run:

```bash
gh pr create --base main --head codex/guided-learning-splash --title "Guided learning and login splash" --body-file docs/superpowers/plans/2026-05-04-guided-learning-and-login-splash-implementation.md --draft
```

- [ ] **Step 3: Wait for Vercel**

Run:

```bash
gh pr checks --watch --interval 10
```

Expected: Vercel and preview comments pass.

- [ ] **Step 4: Mark ready and merge**

After local verification and Vercel pass:

```bash
gh pr ready
gh pr merge --merge --delete-branch
```

- [ ] **Step 5: Align local main**

Run:

```bash
git switch main
git pull --ff-only origin main
git status --short --branch
```

Expected: `main...origin/main` with no local changes.

## Plan Self-Review

- Spec coverage:
  - User-triggered tours: Task 1 and Task 3.
  - Highlights, bubbles, blocked interaction, skip: Task 1.
  - App Guide 101/201/301 and Home learning hub: Task 2.
  - Welcome and Settings retriggering: Task 2.
  - Crash-course character scenes: Task 5.
  - Login splash with nature, characters, animation, reduced motion: Task 4.
  - E2E and full verification: Task 6.
  - PR, Vercel, merge, local-main alignment: Task 7.
- Placeholder scan: no unresolved placeholders or vague "write tests" steps remain.
- Type consistency: `GuideStep`, `FeatureGuide`, `FEATURE_GUIDES`, `GuidedTour`, and `FeatureGuideLauncher` names are used consistently across tasks.
