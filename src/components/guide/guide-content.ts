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
        targetId: "load-map-move-target",
        practice: {
          actionLabel: "Move dummy card to Player 1",
          completionMessage: "Dummy card moved to Player 1.",
          eventId: "load-map-move",
          prompt: "Practice moving a dummy card without changing your real board."
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
        title: "Use greg - the taskmaster",
        body: "Greg turns a quick text or voice note into a draft card you can review before it joins the household system.",
        targetId: "library-ai-task-manager",
        practice: {
          actionLabel: "Open greg in dummy mode",
          completionMessage: "Dummy greg tray opened.",
          eventId: "library-ai-task-manager",
          prompt: "Open a pretend capture tray so you can see where an AI-created card starts."
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
        targetId: "radar-actions",
        practice: {
          actionLabel: "Resolve dummy radar item",
          completionMessage: "Dummy radar item resolved.",
          eventId: "radar-actions",
          prompt: "Practice choosing a next step on a dummy radar topic."
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
        targetId: "check-in-complete-action",
        practice: {
          actionLabel: "Complete dummy check-in",
          completionMessage: "Dummy check-in completed.",
          eventId: "check-in-complete",
          prompt: "Practice completing a check-in without saving a real summary."
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
          actionLabel: "Open dummy learning hub",
          completionMessage: "Dummy learning hub opened.",
          eventId: "settings-learning-hub",
          prompt: "Practice finding the learning hub without leaving this page."
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
