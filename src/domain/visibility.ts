import { z } from "zod";

import { VisibilitySchema, type Visibility } from "./enums";

export const VisibilityTransitionSchema = z.object({
  from: VisibilitySchema,
  to: VisibilitySchema,
  confirmed: z.boolean().default(false)
});

export type VisibilityTransition = z.infer<typeof VisibilityTransitionSchema>;

const PUBLISH_TARGETS: ReadonlySet<Visibility> = new Set([
  "shared_household",
  "partner_visible",
  "check_in_only"
]);

export function assertVisibilityTransition(
  transition: z.input<typeof VisibilityTransitionSchema>
): VisibilityTransition {
  const parsed = VisibilityTransitionSchema.parse(transition);

  if (
    parsed.from === "private" &&
    PUBLISH_TARGETS.has(parsed.to) &&
    !parsed.confirmed
  ) {
    throw new Error(
      "Explicit confirmation is required before publishing a private draft."
    );
  }

  return parsed;
}

export function isPrivateDraftPublish(
  from: Visibility,
  to: Visibility
): boolean {
  return from === "private" && PUBLISH_TARGETS.has(to);
}
