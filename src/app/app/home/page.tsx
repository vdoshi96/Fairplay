import Link from "next/link";

export default function AppHomePage() {
  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
          Home
        </p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Household overview
        </h1>
        <p className="text-[15px] leading-6 text-fp-muted-ink">
          Start with a few responsibilities, keep radar topics practical, and
          use check-ins for decisions that need a clear next step.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <a
          className="rounded-[8px] border border-fp-line bg-white p-4 outline-none focus:ring-2 focus:ring-fp-ink/25"
          href="/app/load-map"
        >
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Load Map
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-fp-muted-ink">
            Map household work and ownership as the next feature lands.
          </p>
        </a>
        <a
          className="rounded-[8px] border border-fp-line bg-white p-4 outline-none focus:ring-2 focus:ring-fp-ink/25"
          href="/app/radar"
        >
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">Radar</h2>
          <p className="mt-1 text-[14px] leading-5 text-fp-muted-ink">
            Hold blockers and unclear expectations for future review.
          </p>
        </a>
        <Link
          className="rounded-[8px] border border-fp-line bg-white p-4 outline-none focus:ring-2 focus:ring-fp-ink/25"
          href="/app/check-ins"
        >
          <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
            Check-ins
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-fp-muted-ink">
            Schedule calm decision time when the household is ready.
          </p>
        </Link>
      </div>
    </section>
  );
}
