import { describe, expect, it, vi } from "vitest";

import type { RadarCreate, RadarDetail } from "@/contracts/radar";
import type { Visibility } from "@/domain/enums";
import type { CurrentSession } from "@/server/auth/current-session";
import {
  createRadarService,
  RadarServiceError,
  type RadarRecord,
  type RadarServiceDeps
} from "./service";

const householdId = "550e8400-e29b-41d4-a716-446655440000";
const otherHouseholdId = "550e8400-e29b-41d4-a716-446655440099";
const alexId = "550e8400-e29b-41d4-a716-446655440001";
const maxId = "550e8400-e29b-41d4-a716-446655440002";
const radarId = "550e8400-e29b-41d4-a716-446655440010";
const checkInId = "550e8400-e29b-41d4-a716-446655440080";

const session: CurrentSession = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId,
  selectedPersonaId: alexId,
  createdAt: "2026-05-04T12:00:00.000Z",
  lastSeenAt: "2026-05-04T12:00:00.000Z",
  expiresAt: "2026-06-04T12:00:00.000Z",
  revokedAt: null,
  userAgentHash: null
};

function record(overrides: Partial<RadarRecord> = {}): RadarRecord {
  return {
    id: radarId,
    householdId,
    createdByPersonaId: alexId,
    responsibilityId: null,
    topic: "Clarify morning handoff",
    notes: "Keep this draft private for now.",
    desiredTiming: null,
    reasonKey: "unclear_expectation",
    urgency: "normal",
    visibility: "private",
    state: "draft",
    targetCheckInId: null,
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:00:00.000Z",
    resolvedAt: null,
    deferredUntil: null,
    ...overrides
  };
}

function detail(overrides: Partial<RadarDetail> = {}): RadarDetail {
  const base = record(overrides as Partial<RadarRecord>);

  return {
    id: base.id,
    topic: base.topic,
    responsibilityId: base.responsibilityId,
    reasonKey: base.reasonKey,
    urgency: base.urgency,
    visibility: base.visibility,
    state: base.state,
    notes: base.notes,
    desiredTiming: base.desiredTiming,
    targetCheckInId: base.targetCheckInId,
    deferredUntil: base.deferredUntil,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt,
    resolvedAt: base.resolvedAt
  };
}

function makeDeps(overrides: Partial<RadarServiceDeps> = {}): RadarServiceDeps {
  const records = [
    record(),
    record({
      id: "550e8400-e29b-41d4-a716-446655440011",
      createdByPersonaId: maxId,
      topic: "Max private draft",
      visibility: "private"
    }),
    record({
      id: "550e8400-e29b-41d4-a716-446655440012",
      createdByPersonaId: maxId,
      topic: "Shared calendar snag",
      reasonKey: "blocked",
      urgency: "soon",
      visibility: "shared_household",
      state: "open"
    })
  ];

  return {
    ensurePersonaInHousehold: vi.fn().mockResolvedValue(true),
    ensureResponsibilityInHousehold: vi.fn().mockResolvedValue(true),
    ensureCheckInInHousehold: vi.fn().mockResolvedValue(true),
    listRecords: vi.fn().mockResolvedValue(records),
    getRecord: vi.fn().mockImplementation(async ({ id }) => {
      return records.find((candidate) => candidate.id === id) ?? null;
    }),
    createRecord: vi.fn().mockImplementation(async (input) =>
      detail({
        ...input,
        id: "550e8400-e29b-41d4-a716-446655440040",
        state: input.visibility === "private" ? "draft" : "open",
        targetCheckInId: input.targetCheckInId ?? null,
        createdAt: "2026-05-04T12:00:00.000Z",
        updatedAt: "2026-05-04T12:00:00.000Z",
        resolvedAt: null
      })
    ),
    updateRecord: vi.fn().mockImplementation(async (input) =>
      detail({
        ...input,
        id: input.id,
        updatedAt: "2026-05-05T12:00:00.000Z"
      })
    ),
    ...overrides
  };
}

const createInput: RadarCreate = {
  topic: "Clarify morning handoff",
  notes: "Draft a calm version.",
  responsibilityId: null,
  reasonKey: "unclear_expectation",
  urgency: "normal",
  visibility: "private"
};

describe("radar service", () => {
  it("lists selected persona private drafts with shared household items", async () => {
    const service = createRadarService(makeDeps());

    const items = await service.list(session);

    expect(items.map((item) => item.topic)).toEqual([
      "Clarify morning handoff",
      "Shared calendar snag"
    ]);
    expect(items.some((item) => item.topic === "Max private draft")).toBe(false);
  });

  it("creates private drafts as draft and shared visibility as open", async () => {
    const deps = makeDeps();
    const service = createRadarService(deps);

    await service.create(session, createInput);
    await service.create(session, {
      ...createInput,
      visibility: "check_in_only"
    });

    expect(deps.createRecord).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        createdByPersonaId: alexId,
        householdId,
        state: "draft",
        visibility: "private"
      })
    );
    expect(deps.createRecord).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        state: "open",
        visibility: "check_in_only"
      })
    );
  });

  it("requires explicit confirmation before publishing a private draft", async () => {
    const service = createRadarService(makeDeps());

    await expect(
      service.publish(session, radarId, {
        id: radarId,
        fromVisibility: "private",
        visibility: "check_in_only",
        confirmPrivateDraftPublish: false
      })
    ).rejects.toMatchObject({
      code: "INVALID_INPUT"
    });
  });

  it("publishes with matching current visibility and opens the item", async () => {
    const deps = makeDeps();
    const service = createRadarService(deps);

    await service.publish(session, radarId, {
      id: radarId,
      fromVisibility: "private",
      visibility: "partner_visible",
      confirmPrivateDraftPublish: true
    });

    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        visibility: "partner_visible",
        state: "open"
      })
    );
  });

  it("updates editable fields without changing visibility through the edit path", async () => {
    const deps = makeDeps();
    const service = createRadarService(deps);

    await service.update(session, radarId, {
      topic: "Clarify the school morning plan",
      notes: null,
      reasonKey: "handoff_needed",
      urgency: "soon"
    });

    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        topic: "Clarify the school morning plan",
        notes: null,
        reasonKey: "handoff_needed",
        urgency: "soon"
      })
    );
    expect(deps.updateRecord).not.toHaveBeenCalledWith(
      expect.objectContaining({ visibility: expect.any(String) as Visibility })
    );
  });

  it("sets deferred and resolved timestamps through dedicated transitions", async () => {
    const deps = makeDeps();
    const service = createRadarService(deps);

    await service.defer(session, radarId, {
      id: radarId,
      deferredUntil: "2026-05-11T12:00:00.000Z"
    });
    await service.resolve(session, radarId, {
      id: radarId,
      resolvedAt: "2026-05-12T12:00:00.000Z"
    });

    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        state: "deferred",
        deferredUntil: "2026-05-11T12:00:00.000Z",
        resolvedAt: null
      })
    );
    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        state: "resolved",
        resolvedAt: "2026-05-12T12:00:00.000Z"
      })
    );
  });

  it("passes desired timing through create and update paths", async () => {
    const deps = makeDeps();
    const service = createRadarService(deps);

    await service.create(session, {
      ...createInput,
      desiredTiming: "Before next Monday"
    } as RadarCreate);
    await service.update(session, radarId, {
      desiredTiming: "After the school meeting"
    } as Partial<RadarCreate>);

    expect(deps.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        desiredTiming: "Before next Monday"
      })
    );
    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        desiredTiming: "After the school meeting"
      })
    );
  });

  it("schedules to a check-in or check-in-ready placeholder state", async () => {
    const deps = makeDeps();
    const service = createRadarService(deps);

    await service.schedule(session, radarId, { targetCheckInId: checkInId });
    await service.schedule(session, radarId, { targetCheckInId: null });

    expect(deps.ensureCheckInInHousehold).toHaveBeenCalledWith({
      householdId,
      checkInId
    });
    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        targetCheckInId: checkInId,
        state: "scheduled"
      })
    );
    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: radarId,
        targetCheckInId: null,
        state: "scheduled"
      })
    );
  });

  it("rejects cross-household and other-persona private draft access", async () => {
    const service = createRadarService(
      makeDeps({
        getRecord: vi.fn().mockResolvedValue(
          record({
            householdId: otherHouseholdId
          })
        )
      })
    );

    await expect(service.get(session, radarId)).rejects.toBeInstanceOf(
      RadarServiceError
    );

    const otherPersonaPrivate = createRadarService(
      makeDeps({
        getRecord: vi.fn().mockResolvedValue(
          record({
            createdByPersonaId: maxId,
            visibility: "private"
          })
        )
      })
    );

    await expect(otherPersonaPrivate.get(session, radarId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });
});
