import { describe, expect, it } from "vitest";

import {
  CreateHouseholdRequestSchema,
  CreateHouseholdResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  SelectPersonaRequestSchema,
  SelectPersonaResponseSchema
} from "./auth";

describe("auth JSON contracts", () => {
  it("accepts documented create household request and response examples", () => {
    expect(
      CreateHouseholdRequestSchema.parse({
        householdName: "Maple House",
        username: " Maple_House ",
        password: "client-supplied secret",
        timezone: "America/Chicago"
      })
    ).toMatchObject({ username: "maple-house" });

    expect(
      CreateHouseholdResponseSchema.parse({
        household: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Maple House",
          timezone: "America/Chicago"
        },
        personas: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            key: "alex",
            displayName: "Alex"
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            key: "max",
            displayName: "Max"
          }
        ],
        requiresPersonaSelection: true
      })
    ).toMatchObject({ requiresPersonaSelection: true });
  });

  it("accepts documented login and persona selection examples", () => {
    expect(
      LoginRequestSchema.parse({
        username: " Maple House ",
        password: "client-supplied secret"
      })
    ).toMatchObject({ username: "maple-house" });

    expect(
      LoginResponseSchema.parse({
        household: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Maple House"
        },
        personas: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            key: "alex",
            displayName: "Alex"
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            key: "max",
            displayName: "Max"
          }
        ],
        requiresPersonaSelection: true
      })
    ).toMatchObject({ household: { name: "Maple House" } });

    expect(
      SelectPersonaRequestSchema.parse({
        personaId: "550e8400-e29b-41d4-a716-446655440001"
      })
    ).toMatchObject({ personaId: "550e8400-e29b-41d4-a716-446655440001" });

    expect(
      SelectPersonaResponseSchema.parse({
        session: {
          householdId: "550e8400-e29b-41d4-a716-446655440000",
          selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001",
          expiresAt: "2026-05-05T12:00:00.000Z"
        }
      })
    ).toMatchObject({ session: { householdId: "550e8400-e29b-41d4-a716-446655440000" } });
  });

  it("rejects unsafe household usernames before create or login handlers run", () => {
    for (const username of [
      "   ",
      "---",
      "!!",
      "ma",
      "maple@house",
      "maple/house"
    ]) {
      expect(() =>
        CreateHouseholdRequestSchema.parse({
          householdName: "Maple House",
          username,
          password: "client-supplied secret",
          timezone: "America/Chicago"
        })
      ).toThrow();

      expect(() =>
        LoginRequestSchema.parse({
          username,
          password: "client-supplied secret"
        })
      ).toThrow();
    }
  });
});
