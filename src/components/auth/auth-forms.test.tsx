import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PersonaSummary } from "@/contracts/personas";
import { Button } from "@/components/ui/button";
import { CreateHouseholdForm } from "./create-household-form";
import { LoginForm } from "./login-form";
import { LoginPageClient } from "./login-page-client";
import { PersonaChooser } from "./persona-chooser";

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}));

const personas: PersonaSummary[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    key: "alex",
    displayName: "Alex",
    avatarKey: "alex"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    key: "max",
    displayName: "Max",
    avatarKey: "max"
  }
];

describe("auth forms", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    routerPush.mockReset();
  });

  it("renders login page content with the household garden splash", () => {
    const { container } = render(<LoginPageClient />);

    expect(screen.getByRole("heading", { name: "Log in to Fairplay" })).toBeVisible();
    const authBackground = container.querySelector("[data-auth-background]");
    expect(authBackground).not.toBeNull();
    expect(authBackground).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/auth-warm-threshold.png')"
    });
    const backgroundWash = container.querySelector(
      "[data-auth-background-wash]"
    );
    expect(backgroundWash).toHaveClass(
      "fp-auth-background-wash",
      "pointer-events-none"
    );
    expect(backgroundWash?.className).not.toContain("mix-blend");

    const authSurface = container.querySelector("[data-auth-surface]");
    expect(authSurface).toHaveClass("fp-auth-surface");
    expect(authSurface).toContainElement(
      screen.getByRole("heading", { name: "Log in to Fairplay" })
    );
    expect(authSurface).toContainElement(
      screen.getByLabelText("Household username")
    );
    expect(
      screen.getByRole("img", { name: "Animated Fairplay household garden scene" })
    ).toBeVisible();
    expect(screen.getByTestId("login-splash-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/login-household-garden.png"
    );
    expect(screen.getByLabelText("Household username")).toBeVisible();
  });

  it("validates login fields before submitting", async () => {
    render(<LoginForm onAuthenticated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter the household username.")).toBeVisible();
    expect(screen.getByText("Enter the household password.")).toBeVisible();
  });

  it("uses theme primary tokens for shared and login primary controls", () => {
    const { rerender } = render(
      <Button variant="primary">Shared primary action</Button>
    );

    const sharedPrimary = screen.getByRole("button", {
      name: "Shared primary action"
    });
    expect(sharedPrimary).toHaveClass("bg-fp-primary", "text-fp-on-primary");
    expect(sharedPrimary.className).not.toContain("text-white");

    rerender(<LoginForm onAuthenticated={vi.fn()} />);

    const loginSubmit = screen.getByRole("button", { name: "Log in" });
    expect(loginSubmit).toHaveClass("bg-fp-primary", "text-fp-on-primary");
    expect(loginSubmit.className).not.toContain("text-white");
  });

  it("submits login when Enter is pressed in a logged-out username field", async () => {
    const onAuthenticated = vi.fn();
    const fetchMock = vi.fn(async () =>
      Response.json({ requiresPersonaSelection: true })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginForm onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText("Household username"), {
      target: { value: "river-home" }
    });
    fireEvent.change(screen.getByLabelText("Household password"), {
      target: { value: "correct horse battery staple" }
    });
    fireEvent.keyDown(screen.getByLabelText("Household username"), {
      key: "Enter",
      code: "Enter"
    });

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("submits login when Enter is pressed in a logged-out password field", async () => {
    const onAuthenticated = vi.fn();
    const fetchMock = vi.fn(async () =>
      Response.json({ requiresPersonaSelection: true })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginForm onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText("Household username"), {
      target: { value: "river-home" }
    });
    fireEvent.change(screen.getByLabelText("Household password"), {
      target: { value: "correct horse battery staple" }
    });
    fireEvent.keyDown(screen.getByLabelText("Household password"), {
      key: "Enter",
      code: "Enter"
    });

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("disables login submit while pending", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          })
      )
    );
    render(<LoginForm onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Household username"), {
      target: { value: "river home" }
    });
    fireEvent.change(screen.getByLabelText("Household password"), {
      target: { value: "correct horse battery staple" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByRole("button", { name: "Logging in..." })
    ).toBeDisabled();

    await act(async () => {
      resolveFetch(Response.json({ requiresPersonaSelection: true }));
    });
  });

  it("shows a generic login failure and clears only the password", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { error: "Unable to log in with that username and password." },
          { status: 401 }
        )
      )
    );
    render(<LoginForm onAuthenticated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Household username"), {
      target: { value: "river-home" }
    });
    fireEvent.change(screen.getByLabelText("Household password"), {
      target: { value: "not the password" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Unable to log in with that username and password.")
    ).toBeVisible();
    expect(screen.getByLabelText("Household username")).toHaveValue("river-home");
    expect(screen.getByLabelText("Household password")).toHaveValue("");
    expect(screen.queryByText("not the password")).not.toBeInTheDocument();
  });

  it("preserves create-household name and username after recoverable errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Username unavailable." }, { status: 409 })
      )
    );
    render(<CreateHouseholdForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Household display name"), {
      target: { value: "River Home" }
    });
    fireEvent.change(screen.getByLabelText("Household username"), {
      target: { value: "river-home" }
    });
    fireEvent.change(screen.getByLabelText("Household password"), {
      target: { value: "correct horse battery staple" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create household" }));

    expect(await screen.findByText("Username unavailable.")).toBeVisible();
    expect(screen.getByLabelText("Household display name")).toHaveValue("River Home");
    expect(screen.getByLabelText("Household username")).toHaveValue("river-home");
    expect(screen.getByLabelText("Household password")).toHaveValue("");
  });
});

describe("persona choice", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows only Alex and Max and submits the selected persona", async () => {
    const onSelected = vi.fn();
    const fetchMock = vi.fn(async () =>
      Response.json({
        session: {
          householdId: "550e8400-e29b-41d4-a716-446655440000",
          selectedPersonaId: personas[1].id,
          expiresAt: "2026-05-11T12:00:00.000Z"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <PersonaChooser
        activePersonaId={null}
        onSelected={onSelected}
        personas={[
          ...personas,
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            key: "other" as PersonaSummary["key"],
            displayName: "Other"
          }
        ]}
      />
    );

    expect(screen.getByRole("button", { name: /choose Alex/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /choose Max/i })).toBeVisible();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /choose Max/i }));

    await waitFor(() => expect(onSelected).toHaveBeenCalledWith(personas[1]));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/personas/select",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ personaId: personas[1].id })
      })
    );
  });
});
