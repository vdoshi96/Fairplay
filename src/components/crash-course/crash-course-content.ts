export type CrashCourseLesson = {
  id: string;
  title: string;
  concept: string;
  action: string;
  scene: CrashCourseSceneKey;
  exampleCardTitle?: string;
};

export type CrashCourseSceneKey =
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

export const CRASH_COURSE_LESSONS: CrashCourseLesson[] = [
  {
    id: "not-a-chore-app",
    title: "Why this is not a chore app",
    concept:
      "Household work is more than visible work. Every responsibility can include physical doing, cognitive tracking, emotional care, and hidden work such as noticing, remembering, coordinating, and following up. The board makes that load discussable without turning either person into the problem.",
    action:
      "Before moving one responsibility, name the visible work and the hidden work that happens before or after it.",
    scene: "not-chore",
    exampleCardTitle: "School forms"
  },
  {
    id: "owner-vs-helper",
    title: "Owner vs. helper",
    concept:
      "A helper can complete a step while someone else still carries the outcome. An owner notices the need, understands the standard, plans the path, initiates without being managed, and follows through when the plan changes.",
    action:
      "When you assign a card, name the owner of the outcome first, then name any helper, backup, or support role separately.",
    scene: "owner-helper",
    exampleCardTitle: "Groceries"
  },
  {
    id: "cpe",
    title: "CPE: Conception, Planning, Execution",
    concept:
      "CPE is the ownership lifecycle: conception is seeing the need and defining the outcome, planning is sequencing and coordinating, and execution is doing the work to the agreed standard. Splitting CPE by accident keeps one person as the manager.",
    action:
      "Open a card detail and check whether one owner can carry all three parts, or whether the card needs a clearer support role.",
    scene: "cpe-path",
    exampleCardTitle: "Birthday party"
  },
  {
    id: "minimum-standards",
    title: "Minimum standards and done well enough",
    concept:
      "Unspoken standards create resentment and rework. A household standard should explain what good enough means here: plain, realistic, shared, and revisable before anyone judges follow-through. The owner gets autonomy inside that agreement.",
    action:
      "Rewrite one standard in your own words so it names what matters, what is flexible, and when it should be reviewed.",
    scene: "standards-note",
    exampleCardTitle: "Packed lunches"
  },
  {
    id: "board-lanes",
    title: "The board lanes",
    concept:
      "The lanes describe the state of a responsibility, not a score. A daily treadmill task with no lasting finish line may carry more load than a finite project, so lane moves should preserve cadence, urgency, and context.",
    action:
      "Move cards only when the lane meaning matches the household decision you want to remember: active, uncertain, owned, intentionally split, paused, or not relevant.",
    scene: "board-lanes",
    exampleCardTitle: "Pet care"
  },
  {
    id: "active-deck",
    title: "Build your active deck",
    concept:
      "A useful board starts by removing noise. Keep irrelevant cards out of play, move uncertain cards to concern, and assign only responsibilities that are active in this season. Fairness improves when the active deck reflects real capacity instead of imagined ideals.",
    action:
      "Trim what does not matter this season before balancing the cards that remain, and mark anything that needs a later review.",
    scene: "active-deck",
    exampleCardTitle: "Holiday cards"
  },
  {
    id: "handoffs",
    title: "Handoffs and re-deals",
    concept:
      "Ownership can change, but context has to move with it. A handoff needs the standard, timing, access, dependencies, likely blockers, training or practice the next owner needs, and a date to review how it is working.",
    action:
      "Before moving an owned card, add the context the next owner would otherwise have to extract by asking, then let the owner learn inside the agreed standard.",
    scene: "handoff",
    exampleCardTitle: "Medical appointments"
  },
  {
    id: "radar-check-ins",
    title: "Radar and check-ins",
    concept:
      "Radar holds unclear standards, blockers, appreciation, and topics that need a calm decision. A check-in turns those signals into choices, deferral when the timing is wrong, acknowledgement, repair, or a next review date.",
    action:
      "Send tension to Radar as a neutral topic instead of waiting until it becomes an argument, and bring one clear decision to the next check-in.",
    scene: "radar-check-in",
    exampleCardTitle: "Bedtime routine"
  },
  {
    id: "fair-is-dynamic",
    title: "Fair is dynamic",
    concept:
      "Fairness is dynamic, not a permanent 50/50 count. Capacity, work seasons, health, travel, children, recovery, and the mix of physical, cognitive, and emotional load all change what a workable share looks like.",
    action:
      "Review whether the current share feels workable before treating card counts as the whole story.",
    scene: "dynamic-fair",
    exampleCardTitle: "Dinner"
  },
  {
    id: "repair-resistance",
    title: "Repair and resistance",
    concept:
      "Defensiveness, hidden expectations, and solo drafting are normal parts of changing a household pattern. Repair works better when the ask is specific, appreciation is real, deferral is allowed, and safety boundaries matter more than finishing a workflow.",
    action:
      "If a topic feels charged or unsafe, keep the draft private, simplify the ask, pause the conversation, and choose outside support instead of forcing a check-in.",
    scene: "repair",
    exampleCardTitle: "Family calendar"
  }
];
