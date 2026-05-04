"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SAFETY_COPY } from "@/lib/safety-copy";
import { AuthPageShell } from "./auth-page-shell";
import { CreateHouseholdForm } from "./create-household-form";

export function CreateHouseholdPageClient() {
  const router = useRouter();

  return (
    <AuthPageShell
      eyebrow="Create shared credentials"
      footer={
        <>
          Already have a household?{" "}
          <Link className="font-semibold text-fp-ink underline" href="/login">
            Log in
          </Link>
        </>
      }
      summary="Create one username and password for this household. After that, choose Alex or Max for the current session."
      title="Create a household"
    >
      <div className="grid gap-4">
        <p className="rounded-[8px] border border-fp-line bg-white px-3 py-2 text-[13px] leading-5 text-fp-muted-ink">
          {SAFETY_COPY.nonClinicalBoundary}
        </p>
        <CreateHouseholdForm
          onCreated={() => {
            router.push("/choose-persona?next=/app/onboarding");
          }}
        />
      </div>
    </AuthPageShell>
  );
}
