"use client";

import { FormEvent, useState } from "react";

import { errorId, fieldId, GENERIC_LOGIN_ERROR, readApiError } from "./form-utils";

type LoginFormProps = {
  onAuthenticated: () => void;
};

type LoginErrors = {
  username?: string;
  password?: string;
  form?: string;
};

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!username.trim()) {
      nextErrors.username = "Enter the household username.";
    }
    if (!password) {
      nextErrors.password = "Enter the household password.";
    }

    if (nextErrors.username || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    setPending(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        setPassword("");
        setErrors({
          form: response.status === 401 || response.status === 429
            ? GENERIC_LOGIN_ERROR
            : await readApiError(response)
        });
        return;
      }

      setPassword("");
      onAuthenticated();
    } catch {
      setPassword("");
      setErrors({
        form: "Unable to reach Fairplay. Check your connection and try again."
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {errors.form ? (
        <p
          className="rounded-[8px] border border-fp-danger/40 bg-white px-3 py-2 text-[14px] leading-5 text-fp-danger"
          role="alert"
        >
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <label className="text-[13px] font-semibold text-fp-ink" htmlFor={fieldId("login-username")}>
          Household username
        </label>
        <input
          aria-describedby={errors.username ? errorId("login-username") : undefined}
          aria-invalid={errors.username ? "true" : "false"}
          autoComplete="username"
          className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[15px] text-fp-ink outline-none transition focus:border-fp-alex focus:ring-2 focus:ring-fp-alex/25"
          id={fieldId("login-username")}
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
        {errors.username ? (
          <p className="text-[13px] font-medium text-fp-danger" id={errorId("login-username")}>
            {errors.username}
          </p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label className="text-[13px] font-semibold text-fp-ink" htmlFor={fieldId("login-password")}>
          Household password
        </label>
        <input
          aria-describedby={errors.password ? errorId("login-password") : undefined}
          aria-invalid={errors.password ? "true" : "false"}
          autoComplete="current-password"
          className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 text-[15px] text-fp-ink outline-none transition focus:border-fp-alex focus:ring-2 focus:ring-fp-alex/25"
          id={fieldId("login-password")}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        {errors.password ? (
          <p className="text-[13px] font-medium text-fp-danger" id={errorId("login-password")}>
            {errors.password}
          </p>
        ) : null}
      </div>

      <button
        className="min-h-11 rounded-[8px] bg-fp-ink px-4 text-[14px] font-semibold text-white outline-none transition hover:bg-fp-ink/90 focus:ring-2 focus:ring-fp-ink/30 disabled:cursor-not-allowed disabled:bg-fp-muted-ink"
        disabled={pending}
        type="submit"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
