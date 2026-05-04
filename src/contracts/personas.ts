import { z } from "zod";

import { PersonaKeySchema } from "../domain/enums";
import { PersonaIdSchema } from "../domain/ids";

export const PersonaSummarySchema = z
  .object({
    id: PersonaIdSchema,
    key: PersonaKeySchema,
    displayName: z.string().trim().min(1).max(80),
    avatarKey: z.string().trim().min(1).max(80).optional()
  })
  .strict();

export const PersonaSelectionSchema = z
  .object({
    selectedPersonaId: PersonaIdSchema,
    selectedPersonaKey: PersonaKeySchema.optional()
  })
  .strict();

export type PersonaSummary = z.infer<typeof PersonaSummarySchema>;
export type PersonaSelection = z.infer<typeof PersonaSelectionSchema>;
