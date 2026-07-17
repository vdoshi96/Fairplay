import { beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(
  () =>
    (fn: (...args: unknown[]) => unknown) => {
      let result: unknown;
      let resolved = false;

      return (...args: unknown[]) => {
        if (!resolved) {
          result = fn(...args);
          resolved = true;
        }

        return result;
      };
    }
);
const headers = vi.hoisted(() => vi.fn(async () => new Headers()));
const getCurrentSession = vi.hoisted(() => vi.fn());
const findHouseholdSummaryById = vi.hoisted(() => vi.fn());
const listPersonasForHousehold = vi.hoisted(() => vi.fn());

vi.mock("react", () => ({ cache }));
vi.mock("next/headers", () => ({ headers }));
vi.mock("@/server/auth/current-session", () => ({ getCurrentSession }));
vi.mock("@/server/repositories/households", () => ({
  findHouseholdSummaryById
}));
vi.mock("@/server/repositories/personas", () => ({
  listPersonasForHousehold
}));

describe("getAppSessionView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("loads the session, household, and personas once per server request", async () => {
    const householdId = "68d8178b-a0ab-4f6e-a367-5308be369dbb";
    const selectedPersonaId = "56f3a328-af6d-4d1d-b8c7-603640126633";
    const household = {
      id: householdId,
      name: "Fairplay Home",
      timezone: "America/Chicago"
    };
    const personas = [
      {
        id: selectedPersonaId,
        householdId,
        key: "alex",
        displayName: "Alex"
      },
      {
        id: "0f476440-955d-4a43-b9ab-786287d53e4b",
        householdId,
        key: "max",
        displayName: "Max"
      }
    ];
    getCurrentSession.mockResolvedValue({ householdId, selectedPersonaId });
    findHouseholdSummaryById.mockResolvedValue(household);
    listPersonasForHousehold.mockResolvedValue(personas);
    const { getAppSessionView } = await import("./session-view");

    const [first, second] = await Promise.all([
      getAppSessionView(),
      getAppSessionView()
    ]);

    expect(first).toEqual({
      household,
      personas,
      selectedPersona: personas[0],
      selectedPersonaId
    });
    expect(second).toBe(first);
    expect(headers).toHaveBeenCalledTimes(1);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
    expect(findHouseholdSummaryById).toHaveBeenCalledTimes(1);
    expect(listPersonasForHousehold).toHaveBeenCalledTimes(1);
  });
});
