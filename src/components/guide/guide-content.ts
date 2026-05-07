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
  practice?: GuidePractice;
};

export type GuidePractice = {
  actionLabel: string;
  completionMessage: string;
  eventId: string;
  prompt: string;
  requiredEventIds?: string[];
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
        title: "About this feature",
        body: "Practice reading lanes, ownership, and card movement so you know why the Load Map turns household work into visible agreements instead of a scoreboard.",
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
        targetId: "load-map-move-target",
        practice: {
          actionLabel: "Start dummy Load Map workflow",
          completionMessage: "Dummy card moved, edited, trimmed, and deleted.",
          eventId: "load-map-practice-start",
          prompt:
            "Practice moving, editing, trimming, and deleting dummy cards without changing your real board.",
          requiredEventIds: [
            "load-map-move",
            "load-map-edit",
            "load-map-trim",
            "load-map-delete"
          ]
        }
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
    description: "Learn AI card drafts, search, labels, source cards, and putting a card in play.",
    steps: [
      {
        id: "ai-task-manager",
        title: "About this feature",
        body: "Practice a temporary Greg capture and draft review. The demo data stays local to onboarding, and nothing permanent is created.",
        targetId: "library-ai-task-manager",
        practice: {
          actionLabel: "Start dummy Library workflow",
          completionMessage: "Dummy Library workflow complete.",
          eventId: "library-practice-start",
          prompt:
            "Use a dummy Greg capture, review the generated draft, edit it, preview imagery, and put it in play without creating a real card.",
          requiredEventIds: [
            "library-capture-filled",
            "library-draft-reviewed",
            "library-draft-edited",
            "library-image-previewed",
            "library-put-in-play"
          ]
        }
      },
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
        title: "About this feature",
        body: "Practice turning a concern into a temporary Radar item so you can see how unclear work moves toward a shared next step without blaming anyone.",
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
        targetId: "radar-actions",
        practice: {
          actionLabel: "Start dummy Radar workflow",
          completionMessage: "Dummy Radar workflow complete.",
          eventId: "radar-practice-start",
          prompt:
            "Create, edit, choose visibility, defer, schedule, resolve, and dismiss a dummy radar item.",
          requiredEventIds: [
            "radar-practice-create",
            "radar-practice-edit",
            "radar-practice-visibility",
            "radar-practice-defer",
            "radar-practice-schedule",
            "radar-practice-resolve",
            "radar-practice-dismiss"
          ]
        }
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
        title: "About this feature",
        body: "Practice previewing a temporary agenda and recording calm outcomes. Check-ins turn Radar topics into things to discuss, skip, defer, or decide.",
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
        targetId: "check-in-complete-action",
        practice: {
          actionLabel: "Start dummy Check-in workflow",
          completionMessage: "Dummy Check-in workflow complete.",
          eventId: "check-in-practice-start",
          prompt:
            "Preview a dummy agenda, assign a topic, record a decision, defer an item, and complete a dummy check-in.",
          requiredEventIds: [
            "check-in-agenda-previewed",
            "check-in-topic-assigned",
            "check-in-decision-recorded",
            "check-in-item-deferred",
            "check-in-complete"
          ]
        }
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
        body: "Restart the crash course, show the welcome again, or open the learning hub from here.",
        targetId: "settings-guided-start",
        practice: {
          actionLabel: "Start dummy Settings workflow",
          completionMessage: "Dummy Settings workflow complete.",
          eventId: "settings-practice-start",
          prompt:
            "Practice appearance, welcome replay, persona confirmation, and learning hub actions without changing account data.",
          requiredEventIds: [
            "settings-appearance-mode",
            "settings-welcome-replay",
            "settings-persona-confirm",
            "settings-learning-hub"
          ]
        }
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
