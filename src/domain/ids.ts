import { randomUUID } from "crypto";
import { z } from "zod";

export const IdSchema = z.string().uuid();
export const HouseholdIdSchema = IdSchema;
export const PersonaIdSchema = IdSchema;
export const ResponsibilityIdSchema = IdSchema;
export const RadarItemIdSchema = IdSchema;
export const CheckInIdSchema = IdSchema;
export const CheckInItemIdSchema = IdSchema;
export const DecisionIdSchema = IdSchema;

export type EntityId = z.infer<typeof IdSchema>;
export type HouseholdId = EntityId;
export type PersonaId = EntityId;
export type ResponsibilityId = EntityId;
export type RadarItemId = EntityId;
export type CheckInId = EntityId;
export type CheckInItemId = EntityId;
export type DecisionId = EntityId;

export function createEntityId(): EntityId {
  return randomUUID();
}

export function normalizeHouseholdUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
