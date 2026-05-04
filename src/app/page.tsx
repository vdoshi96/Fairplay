import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-fp-paper px-4 py-6 text-fp-ink sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col justify-between gap-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center rounded-[8px] border border-fp-line bg-white shadow-soft"
            >
              <span className="relative h-6 w-6 rounded-full border-2 border-fp-shared">
                <span className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-fp-alex" />
                <span className="absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-fp-max" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rotate-45 rounded-[3px] bg-fp-helper" />
              </span>
            </span>
            <span className="text-[17px] font-bold leading-6">Fairplay</span>
          </div>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Link
              className="grid min-h-11 place-items-center rounded-[8px] border border-fp-line bg-white px-4 text-[13px] font-semibold text-fp-ink"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="grid min-h-11 place-items-center rounded-[8px] bg-fp-ink px-4 text-[13px] font-semibold text-white"
              href="/create-household"
            >
              Create household
            </Link>
          </nav>
        </header>

        <div className="grid gap-8 pb-6 pt-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-end md:pb-12 md:pt-16">
          <div className="max-w-2xl">
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
              Household planning
            </p>
            <h1 className="text-[42px] font-bold leading-[1.05] text-fp-ink sm:text-[56px]">
              Fairplay
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-7 text-fp-muted-ink">
              Map shared responsibilities, make ownership clear, and keep
              reviews practical without scores or blame.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="grid min-h-11 place-items-center rounded-[8px] bg-fp-ink px-5 text-[14px] font-semibold text-white"
                href="/login"
              >
                Log in
              </Link>
              <Link
                className="grid min-h-11 place-items-center rounded-[8px] border border-fp-line bg-white px-5 text-[14px] font-semibold text-fp-ink"
                href="/create-household"
              >
                Create household
              </Link>
            </div>
          </div>

          <aside
            aria-label="PWA readiness"
            className="border-l-4 border-fp-shared bg-fp-surface p-4"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-fp-muted-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-fp-success" />
              Install-ready baseline
            </div>
            <p className="mt-3 text-[15px] leading-6 text-fp-ink">
              App metadata, manifest, and icons are ready for the next auth and
              app-shell tasks.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
