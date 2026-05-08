export type CrashCourseLesson = {
  id: string;
  title: string;
  concept: string;
  action: string;
  scene: CrashCourseSceneKey;
  exampleCardTitle?: string;
  featurePath?: Array<{
    description: string;
    href: string;
    label: string;
  }>;
};

export type CrashCourseSceneKey =
  | "hidden-load-entry"
  | "visible-reminder"
  | "treadmill-reset"
  | "active-set"
  | "helper-owner"
  | "cpe-outcome"
  | "done-standard"
  | "standard-autonomy"
  | "handoff-context"
  | "load-map"
  | "capacity-shift"
  | "check-in-signal"
  | "repair-loop"
  | "next-move";

export const CRASH_COURSE_LESSONS: CrashCourseLesson[] = [
  {
    id: "hidden-load-entry",
    title: "Start with hidden work",
    concept:
      "Visible work is the part anyone can see. Hidden work is the noticing, remembering, timing, comparing, emotional care, and follow-through that make the visible part possible.",
    action:
      "Name what happens before and after the obvious task.",
    scene: "hidden-load-entry",
    exampleCardTitle: "School forms"
  },
  {
    id: "visible-reminder",
    title: "Split doing from remembering",
    concept:
      "A task can look shared while one person still carries the reminder system. Physical action can move without moving the cognitive load of tracking timing, details, and consequences.",
    action:
      "Ask who notices, who decides, and who follows up.",
    scene: "visible-reminder",
    exampleCardTitle: "Birthday gift"
  },
  {
    id: "treadmill-reset",
    title: "Count the reset",
    concept:
      "Some responsibilities reset like a treadmill. Meals, laundry, medicine, and routines may be small each time, but they return again and again. Finite projects usually have a clearer finish line.",
    action:
      "Treat recurring work differently from one-time work.",
    scene: "treadmill-reset",
    exampleCardTitle: "Laundry"
  },
  {
    id: "active-set",
    title: "Keep only live responsibilities",
    concept:
      "Fairness gets foggy when every possible responsibility is treated as active. Some work matters this season, some is paused, and some can be dropped for now.",
    action:
      "Talk about the responsibilities that actually need ownership now.",
    scene: "active-set",
    exampleCardTitle: "Holiday travel"
  },
  {
    id: "helper-owner",
    title: "Helping is not owning",
    concept:
      "Helping is useful, but a helper usually completes a piece of someone else's plan. An owner carries the outcome: noticing the need, setting the standard, coordinating support, and following through.",
    action:
      "Name the owner first, then name any helper role.",
    scene: "helper-owner",
    exampleCardTitle: "Groceries"
  },
  {
    id: "cpe-outcome",
    title: "Own the full path",
    concept:
      "Full ownership means carrying CPE: conception, planning, and execution. The owner does not have to do every step alone, but they keep the responsibility moving from need to reliable outcome.",
    action:
      "Look for split CPE, where one person plans and another only executes.",
    scene: "cpe-outcome",
    exampleCardTitle: "Pet care"
  },
  {
    id: "done-standard",
    title: "Define done well enough",
    concept:
      "Resentment often grows around standards that were never said out loud. Done well enough means the household agrees on the outcome, timing, must-haves, and flexible parts.",
    action:
      "Write the outcome, the must-haves, one flexible part, and a review date.",
    scene: "done-standard",
    exampleCardTitle: "Packed lunches"
  },
  {
    id: "standard-autonomy",
    title: "Leave room for autonomy",
    concept:
      "A shared standard is not an inspection checklist, and it is not permission to do the least possible work. It protects the outcome while letting the owner choose a method.",
    action:
      "If the standard feels like control or avoidance, rewrite it around the outcome.",
    scene: "standard-autonomy",
    exampleCardTitle: "Morning routine"
  },
  {
    id: "handoff-context",
    title: "Pass context with the handoff",
    concept:
      "A handoff is not a last-minute dump. When ownership changes, the current state, access, timing, blockers, training, done-well note, and review date need to move too.",
    action:
      "Share the context the next owner would otherwise have to extract.",
    scene: "handoff-context",
    exampleCardTitle: "Medical appointments"
  },
  {
    id: "load-map",
    title: "Use maps, not scoreboards",
    concept:
      "Fairness is not a scoreboard. A map can show concentration, unclear ownership, recurring load, and due reviews without declaring a winner. Equal counts can still hide time pressure or emotional load.",
    action:
      "Use patterns to choose what needs discussion next.",
    scene: "load-map",
    exampleCardTitle: "Household errands"
  },
  {
    id: "capacity-shift",
    title: "Fair shifts with capacity",
    concept:
      "Fairness is dynamic because life changes. Work seasons, health, travel, caregiving, recovery, stress, and emotional bandwidth all change what is workable.",
    action:
      "When capacity changes, rebalance and set a review date.",
    scene: "capacity-shift",
    exampleCardTitle: "After-school pickup"
  },
  {
    id: "check-in-signal",
    title: "Review while signals are small",
    concept:
      "Small signals are easier to handle before they harden. Blockers, appreciation, unclear standards, missed reviews, and new capacity limits all need a place to be noticed.",
    action:
      "Bring one specific signal while it is still easy to discuss.",
    scene: "check-in-signal",
    exampleCardTitle: "Bedtime routine"
  },
  {
    id: "repair-loop",
    title: "Repair misses plainly",
    concept:
      "Missed standards and defensive moments will happen. Repair is part of the system. A useful repair names what missed, what changed, what support is needed, and what will be different next time.",
    action:
      "If a topic feels unsafe or coercive, do not use a household workflow as the fix.",
    scene: "repair-loop",
    exampleCardTitle: "Bill payment"
  },
  {
    id: "next-move",
    title: "Try one real card",
    concept:
      "After the concepts, start small. Pick one real responsibility, name its hidden work, choose an owner, write done well enough, and set a review point.",
    action:
      "Use the short path below when you are ready to put it into practice.",
    scene: "next-move",
    exampleCardTitle: "One real card",
    featurePath: [
      {
        description: "Choose one responsibility to practice with.",
        href: "/app/library",
        label: "Browse the Library"
      },
      {
        description: "Assign ownership and review the pattern.",
        href: "/app/load-map",
        label: "Open the Load Map"
      },
      {
        description: "Schedule, confirm, and keep simple notes.",
        href: "/app/check-ins/new",
        label: "Schedule a Check-in"
      }
    ]
  }
];
