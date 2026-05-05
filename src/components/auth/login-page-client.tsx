"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthPageShell } from "./auth-page-shell";
import { LoginForm } from "./login-form";
import { LoginSplashIllustration } from "./login-splash-illustration";

export function LoginPageClient() {
  const router = useRouter();

  return (
    <AuthPageShell
      eyebrow="Shared household sign-in"
      footer={
        <>
          New household?{" "}
          <Link className="font-semibold text-fp-ink underline" href="/create-household">
            Create shared credentials
          </Link>
        </>
      }
      summary="Settle into the household rhythm with shared credentials, then choose Alex or Max for this session."
      title="Log in to Fairplay"
      visual={<LoginSplashIllustration />}
    >
      <LoginForm
        onAuthenticated={() => {
          router.push("/choose-persona?next=/app/home");
        }}
      />
    </AuthPageShell>
  );
}
