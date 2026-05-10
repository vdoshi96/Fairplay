"use client";

import { FormEvent, useState } from "react";

import { errorId, fieldId, readApiError } from "./form-utils";

type CreateHouseholdFormProps = {
  onCreated: () => void;
};

type CreateHouseholdErrors = {
  householdName?: string;
  username?: string;
  password?: string;
  form?: string;
};

export function CreateHouseholdForm({ onCreated }: CreateHouseholdFormProps) {
  const [householdName, setHouseholdName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<CreateHouseholdErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: CreateHouseholdErrors = {};
    if (!householdName.trim()) {
      nextErrors.householdName = "Enter a household display name.";
    }
    if (!username.trim()) {
      nextErrors.username = "Enter a household username.";
    }
    if (password.length < 12) {
      nextErrors.password = "Use at least 12 characters.";
    }

    if (nextErrors.householdName || nextErrors.username || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    setPending(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/create-household", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          householdName,
          username,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        })
      });

      if (!response.ok) {
        setPassword("");
        setErrors({
          form: await readApiError(response)
        });
        return;
      }

      setPassword("");
      onCreated();
    } catch {
      setPassword("");
      setErrors({
        form: "Unable to create the household right now. Please try again."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {errors.form ? (
        <p
          className="rounded-[8px] border border-fp-danger/40 bg-[var(--fp-card)] px-3 py-2 text-[14px] leading-5 text-fp-danger"
          role="alert"
        >
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <label
          className="text-[13px] font-semibold text-fp-ink"
          htmlFor={fieldId("household-name")}
        >
          Household display name
        </label>
        <input
          aria-describedby={errors.householdName ? errorId("household-name") : undefined}
          aria-invalid={errors.householdName ? "true" : "false"}
          autoComplete="organization"
          className="fp-input px-3 text-[15px] font-medium"
          id={fieldId("household-name")}
          name="householdName"
          onChange={(event) => setHouseholdName(event.target.value)}
          value={householdName}
        />
        {errors.householdName ? (
          <p className="text-[13px] font-medium text-fp-danger" id={errorId("household-name")}>
            {errors.householdName}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label className="text-[13px] font-semibold text-fp-ink" htmlFor={fieldId("create-username")}>
          Household username
        </label>
        <input
          aria-describedby={errors.username ? errorId("create-username") : undefined}
          aria-invalid={errors.username ? "true" : "false"}
          autoComplete="username"
          className="fp-input px-3 text-[15px] font-medium"
          id={fieldId("create-username")}
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
        {errors.username ? (
          <p className="text-[13px] font-medium text-fp-danger" id={errorId("create-username")}>
            {errors.username}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label className="text-[13px] font-semibold text-fp-ink" htmlFor={fieldId("create-password")}>
          Household password
        </label>
        <input
          aria-describedby={errors.password ? errorId("create-password") : undefined}
          aria-invalid={errors.password ? "true" : "false"}
          autoComplete="new-password"
          className="fp-input px-3 text-[15px] font-medium"
          id={fieldId("create-password")}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        {errors.password ? (
          <p className="text-[13px] font-medium text-fp-danger" id={errorId("create-password")}>
            {errors.password}
          </p>
        ) : null}
      </div>

      <button
        className="min-h-11 rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary shadow-[var(--fp-shadow-soft)] outline-none transition hover:bg-fp-primary-hover focus:ring-2 focus:ring-fp-primary/30 disabled:cursor-not-allowed disabled:bg-fp-primary-disabled"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating..." : "Create household"}
      </button>
    </form>
  );
}
