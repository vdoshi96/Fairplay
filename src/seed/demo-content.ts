import type { Cadence, HiddenEffortKey, SourceReviewStatus } from "../domain/enums";

export const DEMO_CONTENT_VERSION = "2026-05-04.v1";

export const APPROVED_DEMO_AREA_KEYS = [
  "home_base",
  "food_flow",
  "calendar_lane",
  "care_circle",
  "paper_trail",
  "fix_and_fetch",
  "recharge",
  "big_shifts"
] as const;

export type DemoAreaKey = (typeof APPROVED_DEMO_AREA_KEYS)[number];

export const APPROVED_DEMO_AREAS: readonly {
  key: DemoAreaKey;
  label: string;
  description: string;
}[] = [
  {
    key: "home_base",
    label: "Home base",
    description: "Recurring upkeep and shared-space reset."
  },
  {
    key: "food_flow",
    label: "Food flow",
    description: "Meals, groceries, supplies, and kitchen readiness."
  },
  {
    key: "calendar_lane",
    label: "Calendar lane",
    description: "Appointments, reminders, plans, and errands."
  },
  {
    key: "care_circle",
    label: "Care circle",
    description: "Care routines for people or pets in the household."
  },
  {
    key: "paper_trail",
    label: "Paper trail",
    description: "Bills, forms, records, benefits, and household admin."
  },
  {
    key: "fix_and_fetch",
    label: "Fix and fetch",
    description: "Repairs, maintenance, transport, and items that need replacing."
  },
  {
    key: "recharge",
    label: "Recharge",
    description: "Rest, personal time, appreciation, and sustainable routines."
  },
  {
    key: "big_shifts",
    label: "Big shifts",
    description: "Temporary seasons such as moves, illness, travel, or guests."
  }
] as const;

export const APPROVED_DEMO_EXAMPLE_TITLES = [
  "Evening kitchen reset",
  "Weekly meal outline",
  "Appointment follow-through",
  "Laundry rhythm",
  "Supply restock",
  "Weekend plan check",
  "Shared space reset",
  "Bill due-date review"
] as const;

export type DemoResponsibilityTemplate = {
  id: string;
  slug: string;
  title: (typeof APPROVED_DEMO_EXAMPLE_TITLES)[number];
  summary: string;
  areaKeys: readonly DemoAreaKey[];
  defaultCadence: Cadence;
  hiddenEffortKeys: readonly HiddenEffortKey[];
  sourceReviewStatus: Extract<SourceReviewStatus, "approved_original">;
  contentVersion: string;
};

export const DEMO_RESPONSIBILITY_TEMPLATES: readonly DemoResponsibilityTemplate[] = [
  {
    id: "demo_evening_kitchen_reset",
    slug: "evening-kitchen-reset",
    title: "Evening kitchen reset",
    summary: "Reset the kitchen enough that the next meal starts smoothly.",
    areaKeys: ["home_base", "food_flow"],
    defaultCadence: "daily",
    hiddenEffortKeys: ["doing", "follow_through"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_weekly_meal_outline",
    slug: "weekly-meal-outline",
    title: "Weekly meal outline",
    summary: "Sketch a practical meal plan before the week gets busy.",
    areaKeys: ["food_flow", "calendar_lane"],
    defaultCadence: "weekly",
    hiddenEffortKeys: ["planning", "noticing"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_appointment_follow_through",
    slug: "appointment-follow-through",
    title: "Appointment follow-through",
    summary: "Track the next step after a scheduled appointment.",
    areaKeys: ["calendar_lane", "care_circle"],
    defaultCadence: "event_based",
    hiddenEffortKeys: ["planning", "follow_through"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_laundry_rhythm",
    slug: "laundry-rhythm",
    title: "Laundry rhythm",
    summary: "Keep laundry moving at a pace the household can maintain.",
    areaKeys: ["home_base"],
    defaultCadence: "weekly",
    hiddenEffortKeys: ["doing", "follow_through"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_supply_restock",
    slug: "supply-restock",
    title: "Supply restock",
    summary: "Notice and replace commonly used household supplies.",
    areaKeys: ["food_flow", "fix_and_fetch"],
    defaultCadence: "as_needed",
    hiddenEffortKeys: ["noticing", "planning", "doing"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_weekend_plan_check",
    slug: "weekend-plan-check",
    title: "Weekend plan check",
    summary: "Confirm timing, errands, rest, and shared plans for the weekend.",
    areaKeys: ["calendar_lane", "recharge"],
    defaultCadence: "weekly",
    hiddenEffortKeys: ["planning", "emotional_attention"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_shared_space_reset",
    slug: "shared-space-reset",
    title: "Shared space reset",
    summary: "Return a common area to a usable baseline.",
    areaKeys: ["home_base"],
    defaultCadence: "weekly",
    hiddenEffortKeys: ["doing"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  },
  {
    id: "demo_bill_due_date_review",
    slug: "bill-due-date-review",
    title: "Bill due-date review",
    summary: "Check upcoming due dates and confirm the next payment step.",
    areaKeys: ["paper_trail"],
    defaultCadence: "monthly",
    hiddenEffortKeys: ["noticing", "planning", "follow_through"],
    sourceReviewStatus: "approved_original",
    contentVersion: DEMO_CONTENT_VERSION
  }
] as const;
