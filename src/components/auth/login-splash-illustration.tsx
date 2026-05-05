export function LoginSplashIllustration() {
  return (
    <div
      aria-label="Animated Fairplay household garden scene"
      className="relative min-h-[360px] overflow-hidden rounded-[8px] border border-fp-line bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,243,236,0.72)_52%,rgba(63,127,86,0.16))] shadow-soft"
      role="img"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute left-8 top-8 h-16 w-28 rounded-full bg-white/80 shadow-soft fp-motion-cloud-drift" data-testid="login-splash-cloud">
          <span className="absolute -top-5 left-5 h-12 w-12 rounded-full bg-white/90" />
          <span className="absolute -top-3 right-7 h-10 w-10 rounded-full bg-white/85" />
        </div>

        <div className="absolute right-10 top-10 h-20 w-24 rounded-[8px] border border-fp-line bg-white/95">
          <span className="absolute -top-8 left-2 h-8 w-20 rounded-t-[8px] bg-fp-shared/70 [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
          <span className="absolute bottom-0 left-4 h-10 w-7 rounded-t-[6px] bg-fp-helper/45" />
          <span className="absolute right-4 top-4 h-5 w-5 rounded-[4px] bg-fp-radar/35" />
        </div>

        <div
          className="absolute bottom-8 right-10 grid h-28 w-32 gap-2 rounded-[8px] border border-fp-line bg-white/88 p-3 shadow-soft"
          data-testid="login-splash-household-board"
        >
          <span className="h-4 rounded-full bg-fp-alex/22" />
          <span className="h-4 rounded-full bg-fp-max/22" />
          <span className="h-4 rounded-full bg-fp-shared/24" />
          <span className="h-4 rounded-full bg-fp-success/22" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(180deg,rgba(63,127,86,0),rgba(63,127,86,0.24))]" />

        <div
          className="absolute bottom-12 left-10 h-24 w-16 fp-motion-leaf-sway"
          data-testid="login-splash-plant"
        >
          <span className="absolute bottom-0 left-1/2 h-24 w-1 -translate-x-1/2 rounded-full bg-fp-success/65" />
          <span className="absolute bottom-10 left-1 h-9 w-7 -rotate-12 rounded-full bg-fp-success/55" />
          <span className="absolute bottom-16 right-0 h-8 w-6 rotate-12 rounded-full bg-fp-success/55" />
          <span className="absolute bottom-4 right-2 h-8 w-7 rotate-6 rounded-full bg-fp-alex/35" />
        </div>

        <div className="absolute bottom-14 left-[42%] h-20 w-20 rounded-full bg-fp-helper/10" />
        <div
          className="absolute bottom-24 left-[46%] h-5 w-5 rounded-full bg-fp-helper shadow-[0_0_0_10px_rgba(155,109,53,0.12)] fp-motion-radar-pulse"
          data-testid="login-splash-spark"
        >
          <span className="absolute left-1/2 top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fp-helper/70" />
          <span className="absolute left-1/2 top-1/2 h-1 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fp-helper/70" />
        </div>

        <div
          className="absolute bottom-16 left-[24%] h-28 w-20 fp-motion-persona-bob"
          data-testid="login-splash-alex"
        >
          <span className="absolute left-1/2 top-0 h-11 w-11 -translate-x-1/2 rounded-full bg-fp-alex/90" />
          <span className="absolute left-1/2 top-10 h-16 w-14 -translate-x-1/2 rounded-t-[24px] bg-fp-alex/75" />
          <span className="absolute left-0 top-14 h-4 w-9 rotate-[-18deg] rounded-full bg-fp-alex/65" />
          <span className="absolute right-0 top-14 h-4 w-9 rotate-[18deg] rounded-full bg-fp-alex/65" />
        </div>

        <div
          className="absolute bottom-16 left-[58%] h-28 w-20 fp-motion-persona-bob [animation-delay:800ms]"
          data-testid="login-splash-max"
        >
          <span className="absolute left-1/2 top-0 h-11 w-11 -translate-x-1/2 rounded-full bg-fp-max/90" />
          <span className="absolute left-1/2 top-10 h-16 w-14 -translate-x-1/2 rounded-t-[24px] bg-fp-max/75" />
          <span className="absolute left-0 top-14 h-4 w-9 rotate-[-18deg] rounded-full bg-fp-max/65" />
          <span className="absolute right-0 top-14 h-4 w-9 rotate-[18deg] rounded-full bg-fp-max/65" />
        </div>

        <div className="absolute bottom-8 left-[20%] right-[18%] h-2 rounded-full bg-fp-ink/8" />
      </div>
    </div>
  );
}
