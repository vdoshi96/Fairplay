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
    title: "Start with what no one sees",
    concept:
      "Household work is bigger than the part anyone can watch. A form submitted, meal cooked, or ride given is visible work. Hidden work is the noticing, remembering, comparing options, coordinating timing, emotional care, and follow-through that make the visible moment possible.",
    action:
      "Before moving a card, name what happens before and after the obvious task.",
    scene: "hidden-load-entry",
    exampleCardTitle: "School forms"
  },
  {
    id: "visible-reminder",
    title: "Separate the work from the reminder",
    concept:
      "A task can look evenly split while one person still carries the reminder system. If Alex buys the supplies after Max notices the need, tracks the deadline, and explains the standard, the physical action moved but the cognitive load did not.",
    action:
      "Ask who is watching the timing, details, and consequence, not only who does the final action.",
    scene: "visible-reminder",
    exampleCardTitle: "Birthday gift"
  },
  {
    id: "treadmill-reset",
    title: "Name the reset",
    concept:
      "Some responsibilities reset like a treadmill. Dishes, lunches, medicine, laundry, and routines may be small each time, but they return again and again. A finite project can be intense, yet it usually has a clearer finish line.",
    action:
      "Mark whether the card is recurring or finite so the load conversation includes cadence.",
    scene: "treadmill-reset",
    exampleCardTitle: "Laundry"
  },
  {
    id: "active-set",
    title: "Choose what is actually in play",
    concept:
      "Fairness gets foggy when every possible responsibility is treated as active. Some work matters this season, some is paused, and some belongs outside the household plan for now. A smaller active set makes the conversation more honest.",
    action:
      "Keep active only the cards that need ownership now, and pause work that no longer fits this season.",
    scene: "active-set",
    exampleCardTitle: "Holiday travel"
  },
  {
    id: "helper-owner",
    title: "Helping is not the same as owning",
    concept:
      "Helping is valuable, but a helper usually completes a piece of someone else's plan. An owner carries the outcome. They notice the need, decide what good enough means, coordinate support, and absorb the follow-through when the plan changes.",
    action:
      "When support is needed, name the owner first and the helper role second.",
    scene: "helper-owner",
    exampleCardTitle: "Groceries"
  },
  {
    id: "cpe-outcome",
    title: "Carry the whole outcome",
    concept:
      "Full ownership means carrying CPE: conception, planning, and execution. The owner does not need to do every physical step alone, but they keep the responsibility moving from noticing to a completed outcome that the household can rely on.",
    action:
      "Look for split CPE: one person conceives and plans while another only executes.",
    scene: "cpe-outcome",
    exampleCardTitle: "Pet care"
  },
  {
    id: "done-standard",
    title: "Define done before it matters",
    concept:
      "Resentment often grows around standards that were never said out loud. Done well enough is the household's shared answer to what matters, what is flexible, what timing is acceptable, and what care details cannot be skipped.",
    action:
      "Write the outcome, one or two non-negotiables, one flexible part, and when to review it.",
    scene: "done-standard",
    exampleCardTitle: "Packed lunches"
  },
  {
    id: "standard-autonomy",
    title: "Keep the standard kind",
    concept:
      "A shared standard is not an inspection checklist from the more anxious person, and it is not permission to do the least possible work. It protects the outcome while leaving the owner room to build competence and choose a method.",
    action:
      "If the standard feels like control or avoidance, rewrite it around the household outcome.",
    scene: "standard-autonomy",
    exampleCardTitle: "Morning routine"
  },
  {
    id: "handoff-context",
    title: "Move context with the handoff",
    concept:
      "A handoff is not a last-minute dump. When ownership changes, the context has to move too: current state, access, timing, blockers, training or practice needed, the done-well-enough agreement, and a review date.",
    action:
      "Before moving a card, add the context the next owner would otherwise have to extract by asking.",
    scene: "handoff-context",
    exampleCardTitle: "Medical appointments"
  },
  {
    id: "load-map",
    title: "Read the Load Map as a map",
    concept:
      "The Load Map is not a scoreboard. It helps the household see concentration, unclear ownership, cadence, and due reviews. Equal card counts can still hide different capacity, time pressure, complexity, or emotional load.",
    action:
      "Use the map to find what needs discussion, not to declare a winner.",
    scene: "load-map",
    exampleCardTitle: "Household errands"
  },
  {
    id: "capacity-shift",
    title: "Adjust for capacity",
    concept:
      "Fairness is dynamic because life is dynamic. Work seasons, health, travel, children, recovery, stress, and emotional bandwidth change what is workable. A fair plan can ask for a different balance this month than last month.",
    action:
      "When capacity changes, rebalance the active set and set a review date instead of silently keeping the old plan.",
    scene: "capacity-shift",
    exampleCardTitle: "After-school pickup"
  },
  {
    id: "check-in-signal",
    title: "Catch signals in a Check-in",
    concept:
      "Small signals are easier to handle before they harden. A Check-in gives blockers, appreciation, due reviews, unclear standards, and decision points a neutral place to become choices, acknowledgement, deferral, or a next review date.",
    action:
      "Bring one specific signal to a Check-in while it is still small enough to solve calmly.",
    scene: "check-in-signal",
    exampleCardTitle: "Bedtime routine"
  },
  {
    id: "repair-loop",
    title: "Repair the miss",
    concept:
      "Missed standards and defensive moments will happen. Repair is part of the system, not proof that the plan failed. A useful repair names what missed, what context changed, what support is needed, and what will be different next time.",
    action:
      "If a topic feels unsafe, coercive, or likely to escalate, keep notes private for safety, pause the workflow, and choose outside support.",
    scene: "repair-loop",
    exampleCardTitle: "Bill payment"
  },
  {
    id: "next-move",
    title: "Turn the story into one next move",
    concept:
      "The course is meant to make the first conversation easier. Start small: find one real responsibility, make the invisible parts visible, choose an owner, define done well enough, and set a review point before the next busy week.",
    action:
      "Use the learning path below to move from the story to the Library, Load Map, and Check-ins.",
    scene: "next-move",
    exampleCardTitle: "One real card",
    featurePath: [
      {
        description: "Find the responsibilities that match your household.",
        href: "/app/library",
        label: "Browse the Library"
      },
      {
        description: "Assign owners, preserve context, and review the load.",
        href: "/app/load-map",
        label: "Open the Load Map"
      },
      {
        description: "Turn signals into decisions, deferrals, and repair.",
        href: "/app/check-ins/new",
        label: "Run a Check-in"
      }
    ]
  }
];
