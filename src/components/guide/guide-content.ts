export type FeatureGuideId =
  | "loadMap"
  | "library"
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
        body: "Use owner, status, cadence, effort, review, and search to inspect the current load.",
        targetId: "load-map-filters"
      }
    ]
  },
  library: {
    id: "library",
    title: "Library",
    description: "Learn drafts, search, labels, and putting a card in play.",
    steps: [
      {
        id: "ai-task-manager",
        title: "Practice first",
        body: "Try a temporary Greg draft, edit it, and preview Load Map. Nothing permanent is created.",
        targetId: "library-ai-task-manager",
        practice: {
          actionLabel: "Start practice",
          completionMessage: "Practice complete.",
          eventId: "library-practice-start",
          prompt: "Practice the card workflow without creating a real card.",
          requiredEventIds: [
            "library-capture-filled",
            "library-draft-reviewed",
            "library-draft-edited",
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
  checkIns: {
    id: "checkIns",
    title: "Check-ins",
    description: "Learn scheduling, confirmation, and notes.",
    steps: [
      {
        id: "overview",
        title: "About this feature",
        body: "Check-ins are lightweight records: schedule one, confirm it happened, and keep notes.",
        targetId: "check-in-overview"
      },
      {
        id: "schedule",
        title: "Schedule the reminder",
        body: "Pick the date and time. That is the whole setup.",
        targetId: "check-in-schedule"
      },
      {
        id: "complete",
        title: "Confirm and keep notes",
        body: "After the meeting, confirm it happened. Notes are optional and can be updated later.",
        targetId: "check-in-complete-action",
        practice: {
          actionLabel: "Start practice",
          completionMessage: "Practice complete.",
          eventId: "check-in-practice-start",
          prompt: "Practice scheduling, confirming, and saving notes. Nothing is saved.",
          requiredEventIds: [
            "check-in-scheduled",
            "check-in-complete",
            "check-in-notes-updated"
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
        id: "overview",
        title: "About this feature",
        body: "Settings collects device appearance, replay learning controls, persona actions, Little Alex preferences, and session controls so you know where to adjust the app without changing household work.",
        targetId: "settings-overview"
      },
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
