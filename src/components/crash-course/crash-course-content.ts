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
  | "not-chore"
  | "owner-helper"
  | "cpe-path"
  | "standards-note"
  | "board-lanes"
  | "active-deck"
  | "handoff"
  | "dynamic-fair"
  | "repair";

export const CRASH_COURSE_LESSONS: CrashCourseLesson[] = [
  {
    id: "hidden-load",
    title: "See the hidden load",
    concept:
      "Fairplay starts with the idea that a household responsibility is bigger than visible work. The visible part might be a form submitted, a meal cooked, or a ride given. The hidden work is the noticing, remembering, researching, coordinating, emotional care, follow-through, and recovery that happen before and after anyone sees the task. Recurring treadmill work can also feel heavier than a finite project because it resets again tomorrow. A finite project may take effort, but it usually gives everyone a clearer finish line. The goal is to make that load discussable without making either person the villain, and without pretending that equal card counts automatically mean equal capacity, time pressure, or attention.",
    action:
      "Before moving a card, name the physical work, the cognitive work, and any emotional work it carries. A card is ready to discuss when both people can see more than the final action.",
    scene: "not-chore",
    exampleCardTitle: "School forms"
  },
  {
    id: "ownership-cpe",
    title: "Own the outcome",
    concept:
      "Helping is useful, but it is not the same as owning. A helper can complete a step while someone else still watches the deadline, explains the standard, remembers the next move, and absorbs the consequence if it slips. An owner carries CPE: conception, planning, and execution. That means noticing the need, defining the outcome, arranging timing and resources, doing or coordinating the work, and following through when the plan changes. Full ownership builds trust because the other person can stop acting as manager. It also lets the owner build competence instead of waiting for instructions.",
    action:
      "When a responsibility moves to Alex or Max, ask who owns the outcome and which support roles are separate. If one person conceives and plans while the other only executes, the card still needs a clearer agreement.",
    scene: "owner-helper",
    exampleCardTitle: "Groceries"
  },
  {
    id: "done-well-enough",
    title: "Define done well enough",
    concept:
      "Resentment often grows around standards that were never said out loud. Done well enough is the household's shared answer to what good enough means, what matters, what is flexible, what timing is acceptable, and what safety or care details cannot be skipped. It is not an inspection checklist written by the more anxious person, and it is not permission to do the least possible work. It is a short agreement that gives the owner autonomy inside a realistic standard, with room to update it as capacity and life seasons change.",
    action:
      "Rewrite one standard in plain language. Name the outcome, one or two non-negotiables, what can vary, and when the standard should be reviewed instead of silently judged.",
    scene: "standards-note",
    exampleCardTitle: "Packed lunches"
  },
  {
    id: "handoffs-load-map",
    title: "Move work with the context",
    concept:
      "A handoff is not a last-minute dump or a vague request for help. When ownership changes, the context has to move too: current state, timing, access, dependencies, likely blockers, training or practice needed, the done-well-enough standard, and a review date. The Load Map is the place to make those agreements visible. Use it to see concentration, cadence, unclear ownership, and due reviews without turning the household into a scoreboard.",
    action:
      "Before moving an owned card, add the context the next owner would otherwise have to extract by asking. If the work is no longer relevant this season, move it out of play rather than balancing an imaginary deck.",
    scene: "handoff",
    exampleCardTitle: "Medical appointments"
  },
  {
    id: "repair-loop",
    title: "Keep a repair loop",
    concept:
      "Fairness is dynamic. Work seasons, health, travel, children, recovery, stress, and emotional bandwidth change what is workable. A repair loop gives tension a neutral path before it becomes an argument: unclear standards, blockers, appreciation, due reviews, or a decision that needs calmer timing. Check-ins turn those signals into choices, acknowledgement, deferral, repair, or a next review date. Repair is part of the system because missed standards and defensive moments will happen. If a topic feels unsafe, coercive, or likely to escalate, keep notes private, pause the workflow, and choose outside support over forcing a conversation.",
    action:
      "Use the learning path below when you are ready to move from concepts to features. Start with the Library, make ownership visible in the Load Map, and use Check-ins to repair, revise, and rebuild trust.",
    scene: "repair",
    exampleCardTitle: "Bedtime routine",
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
