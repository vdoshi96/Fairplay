export type CrashCourseLesson = {
  id: string;
  title: string;
  concept: string;
  action: string;
  exampleCardTitle?: string;
};

export const CRASH_COURSE_LESSONS: CrashCourseLesson[] = [
  {
    id: "not-a-chore-app",
    title: "Why this is not a chore app",
    concept:
      "Household work is more than the visible final task. It includes noticing, remembering, coordinating, emotional care, and follow-through. The board exists to make that load discussable without turning either person into the problem.",
    action:
      "Look for the hidden planning or care work behind one responsibility before you move it on the board.",
    exampleCardTitle: "School forms"
  },
  {
    id: "owner-vs-helper",
    title: "Owner vs. helper",
    concept:
      "Helping with a step can still leave someone else carrying the outcome. Ownership means the accountable person notices the need, understands the standard, plans the path, and initiates without being managed.",
    action:
      "When you assign a card, name the owner of the outcome, not only the person who can complete a visible step.",
    exampleCardTitle: "Groceries"
  },
  {
    id: "cpe",
    title: "CPE: Conception, Planning, Execution",
    concept:
      "A responsibility has a lifecycle: conception is seeing the need and defining the outcome, planning is sequencing and coordinating, and execution is doing or ensuring the work happens.",
    action:
      "Open a card detail and check whether the same owner can carry all three parts, or whether a handoff needs more context.",
    exampleCardTitle: "Birthday party"
  },
  {
    id: "minimum-standards",
    title: "Minimum standards and done well enough",
    concept:
      "Unspoken standards create resentment and rework. A household standard should be plain, realistic, and shared before anyone judges follow-through; the owner then gets autonomy inside that agreement.",
    action:
      "Rewrite one standard in your own words so it names what matters, what is flexible, and when it should be reviewed.",
    exampleCardTitle: "Packed lunches"
  },
  {
    id: "board-lanes",
    title: "The board lanes",
    concept:
      "The lanes describe the state of a responsibility: reserve cards, concern cards, two owner lanes, intentional child or context splits, and trimmed items that are paused or irrelevant.",
    action:
      "Move cards only when the lane meaning matches the household decision you want to remember.",
    exampleCardTitle: "Pet care"
  },
  {
    id: "active-deck",
    title: "Build your active deck",
    concept:
      "A useful board starts by removing noise. Keep irrelevant cards out of play, move uncertain cards to concern, and assign only responsibilities that are actually active now.",
    action:
      "Trim what does not matter this season before trying to balance the cards that remain.",
    exampleCardTitle: "Holiday cards"
  },
  {
    id: "handoffs",
    title: "Handoffs and re-deals",
    concept:
      "Ownership can change, but context has to move with it. A handoff needs the standard, timing, access, dependencies, likely blockers, and a date to review how it is working.",
    action:
      "Before moving an owned card, add the context the next owner would otherwise have to extract by asking.",
    exampleCardTitle: "Medical appointments"
  },
  {
    id: "radar-check-ins",
    title: "Radar and check-ins",
    concept:
      "Radar holds unclear standards, blockers, and topics that need a calm decision. Check-ins turn those signals into choices, deferrals, acknowledgements, and next review dates.",
    action:
      "Send tension to Radar as a neutral topic instead of waiting until it becomes an argument.",
    exampleCardTitle: "Bedtime routine"
  },
  {
    id: "fair-is-dynamic",
    title: "Fair is dynamic",
    concept:
      "Fairness is not a permanent 50/50 count. Capacity, work seasons, health, travel, children, and personal recovery all change the load profile over time.",
    action:
      "Review whether the current share feels workable before treating card counts as the whole story.",
    exampleCardTitle: "Dinner"
  },
  {
    id: "repair-resistance",
    title: "Repair and resistance",
    concept:
      "Defensiveness, hidden expectations, and solo drafting are normal parts of changing a household pattern. The app should help users pause, clarify, appreciate effort, and invite discussion without forcing a hot conversation.",
    action:
      "If a topic feels charged, draft privately, simplify the ask, and bring one decision to the next check-in.",
    exampleCardTitle: "Family calendar"
  }
];
