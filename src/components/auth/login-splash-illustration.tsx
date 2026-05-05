export function LoginSplashIllustration() {
  return (
    <div
      aria-label="Animated Fairplay household garden scene"
      className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-fp-line bg-[linear-gradient(180deg,#f9dba8_0%,#fff6df_38%,#e7f0c7_62%,#b7d6a8_100%)] shadow-soft"
      role="img"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_76%_18%,rgba(255,206,115,0.74)_0_36px,transparent_38px),linear-gradient(180deg,rgba(255,236,198,0.82),rgba(255,255,255,0.18))]"
          data-testid="login-splash-sky-layer"
        >
          <span className="absolute left-[8%] top-16 h-10 w-28 rounded-full bg-white/55 blur-sm" />
          <span className="absolute right-[20%] top-24 h-8 w-20 rounded-full bg-white/45 blur-sm" />
        </div>

        <div
          className="fp-motion-cloud-drift absolute left-8 top-9 h-16 w-28 rounded-full bg-white/80 shadow-soft"
          data-testid="login-splash-cloud"
        >
          <span className="absolute -top-5 left-5 h-12 w-12 rounded-full bg-white/90" />
          <span className="absolute -top-3 right-7 h-10 w-10 rounded-full bg-white/85" />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-56 bg-[linear-gradient(180deg,rgba(86,132,74,0),rgba(67,127,83,0.34)_42%,rgba(57,108,70,0.56))]"
          data-testid="login-splash-nature-layers"
        >
          <span className="absolute bottom-20 left-[-8%] h-24 w-64 rounded-[50%] bg-fp-success/18" />
          <span className="absolute bottom-28 right-[-10%] h-28 w-72 rounded-[50%] bg-fp-alex/12" />
          <span className="absolute bottom-3 left-[8%] h-14 w-36 rounded-[50%] bg-fp-success/22" />
          <span className="absolute bottom-1 right-[12%] h-16 w-44 rounded-[50%] bg-fp-helper/12" />
        </div>

        <div
          className="absolute right-8 top-14 h-32 w-40 rounded-[8px] border border-fp-line bg-white/95 shadow-soft"
          data-testid="login-splash-house"
        >
          <span className="absolute -top-14 left-[-8px] h-16 w-[calc(100%+16px)] rounded-t-[10px] bg-fp-shared/82 [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
          <span className="absolute left-4 top-5 h-8 w-10 rounded-[6px] border border-fp-line bg-fp-radar/24" />
          <span className="absolute right-5 top-5 h-8 w-10 rounded-[6px] border border-fp-line bg-fp-alex/18" />
          <span className="absolute bottom-0 left-1/2 h-16 w-10 -translate-x-1/2 rounded-t-[8px] bg-fp-helper/52" />
          <span className="absolute bottom-7 left-1/2 h-2 w-2 translate-x-2 rounded-full bg-fp-ink/32" />
          <span className="absolute -bottom-4 left-5 h-8 w-8 rounded-full bg-fp-success/48" />
          <span className="absolute -bottom-5 right-6 h-10 w-10 rounded-full bg-fp-success/42" />
        </div>

        <div
          className="absolute bottom-0 left-[35%] h-48 w-36 -translate-x-1/2 rounded-t-[60%] bg-[linear-gradient(180deg,rgba(255,246,224,0.78),rgba(212,150,88,0.36))] [clip-path:polygon(34%_0,66%_0,100%_100%,0_100%)]"
          data-testid="login-splash-garden-path"
        >
          <span className="absolute bottom-9 left-8 h-3 w-4 rounded-full bg-white/52" />
          <span className="absolute bottom-20 right-9 h-3 w-5 rounded-full bg-fp-helper/24" />
          <span className="absolute bottom-32 left-12 h-2 w-3 rounded-full bg-white/46" />
        </div>

        <div
          className="fp-motion-card-float absolute right-7 top-44 grid w-36 gap-2 rounded-[8px] border border-fp-line bg-white/88 p-3 shadow-soft backdrop-blur-sm"
          data-testid="login-splash-floating-cards"
        >
          <span
            className="grid h-10 grid-cols-[14px_1fr] items-center gap-2 rounded-[6px] bg-fp-alex/12 px-2 text-[10px] font-bold text-fp-ink/72"
            data-testid="login-splash-task-card-dishes"
          >
            <span className="h-4 w-4 rounded-full border-2 border-fp-alex/60" />
            Dishes
          </span>
          <span
            className="grid h-10 grid-cols-[14px_1fr] items-center gap-2 rounded-[6px] bg-fp-max/12 px-2 text-[10px] font-bold text-fp-ink/72"
            data-testid="login-splash-task-card-laundry"
          >
            <span className="h-4 w-4 rounded-[4px] bg-fp-max/42" />
            Laundry
          </span>
          <span
            className="grid h-10 grid-cols-[14px_1fr] items-center gap-2 rounded-[6px] bg-fp-success/12 px-2 text-[10px] font-bold text-fp-ink/72"
            data-testid="login-splash-task-card-garden"
          >
            <span className="h-4 w-4 rounded-full bg-fp-success/46" />
            Garden
          </span>
        </div>

        <div
          className="absolute bottom-8 right-12 grid h-24 w-32 gap-2 rounded-[8px] border border-fp-line bg-white/76 p-3 shadow-soft backdrop-blur-sm"
          data-testid="login-splash-household-board"
        >
          <span className="h-4 rounded-full bg-fp-alex/22" />
          <span className="h-4 rounded-full bg-fp-max/22" />
          <span className="h-4 rounded-full bg-fp-shared/24" />
          <span className="h-4 rounded-full bg-fp-success/22" />
        </div>

        <div
          className="fp-motion-leaf-sway absolute bottom-16 left-8 h-28 w-20"
          data-testid="login-splash-plant"
        >
          <span className="absolute bottom-0 left-1/2 h-28 w-1 -translate-x-1/2 rounded-full bg-fp-success/65" />
          <span className="absolute bottom-12 left-0 h-10 w-8 -rotate-12 rounded-full bg-fp-success/58" />
          <span className="absolute bottom-20 right-2 h-9 w-7 rotate-12 rounded-full bg-fp-success/58" />
          <span className="absolute bottom-5 right-1 h-9 w-8 rotate-6 rounded-full bg-fp-alex/35" />
        </div>

        <div
          className="fp-motion-radar-pulse absolute bottom-36 left-[42%] h-5 w-5 rounded-full bg-fp-helper shadow-[0_0_0_10px_rgba(155,109,53,0.12)]"
          data-testid="login-splash-spark"
        >
          <span className="absolute left-1/2 top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fp-helper/70" />
          <span className="absolute left-1/2 top-1/2 h-1 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fp-helper/70" />
        </div>

        <div
          className="fp-motion-character-breathe absolute bottom-16 left-[18%] h-48 w-64"
          data-testid="login-splash-character-group"
        >
          <div
            className="fp-motion-persona-bob absolute bottom-0 left-0 h-44 w-28"
            data-testid="login-splash-alex"
          >
            <span className="absolute left-1/2 top-1 h-16 w-16 -translate-x-1/2 rounded-full bg-[#b87952]" />
            <span className="absolute left-1/2 top-4 h-12 w-12 -translate-x-1/2 rounded-full bg-[#f3b987]" />
            <span className="absolute left-[42px] top-10 h-2 w-2 rounded-full bg-fp-ink/70" />
            <span className="absolute right-[42px] top-10 h-2 w-2 rounded-full bg-fp-ink/70" />
            <span className="absolute left-1/2 top-16 h-2 w-8 -translate-x-1/2 rounded-full bg-fp-ink/28" />
            <span className="absolute left-1/2 top-16 h-[88px] w-20 -translate-x-1/2 rounded-t-[26px] bg-fp-alex/88" />
            <span className="absolute left-4 top-24 h-5 w-16 rotate-[-24deg] rounded-full bg-fp-alex/72" />
            <span className="absolute right-2 top-24 h-5 w-16 rotate-[22deg] rounded-full bg-fp-alex/72" />
            <span className="absolute bottom-0 left-8 h-12 w-5 rounded-full bg-fp-ink/28" />
            <span className="absolute bottom-0 right-8 h-12 w-5 rounded-full bg-fp-ink/28" />
          </div>

          <div
            className="fp-motion-persona-bob absolute bottom-0 right-4 h-44 w-28 [animation-delay:800ms]"
            data-testid="login-splash-max"
          >
            <span className="absolute left-1/2 top-1 h-16 w-16 -translate-x-1/2 rounded-full bg-[#5a463c]" />
            <span className="absolute left-1/2 top-5 h-12 w-12 -translate-x-1/2 rounded-full bg-[#c89066]" />
            <span className="absolute left-[42px] top-11 h-2 w-2 rounded-full bg-fp-ink/70" />
            <span className="absolute right-[42px] top-11 h-2 w-2 rounded-full bg-fp-ink/70" />
            <span className="absolute left-1/2 top-[67px] h-2 w-7 -translate-x-1/2 rounded-full bg-fp-ink/28" />
            <span className="absolute left-1/2 top-16 h-[88px] w-20 -translate-x-1/2 rounded-t-[26px] bg-fp-max/88" />
            <span className="absolute left-2 top-24 h-5 w-16 rotate-[-22deg] rounded-full bg-fp-max/72" />
            <span className="absolute right-4 top-24 h-5 w-16 rotate-[24deg] rounded-full bg-fp-max/72" />
            <span className="absolute bottom-0 left-8 h-12 w-5 rounded-full bg-fp-ink/28" />
            <span className="absolute bottom-0 right-8 h-12 w-5 rounded-full bg-fp-ink/28" />
          </div>

          <span className="absolute bottom-7 left-[96px] h-14 w-14 rounded-[8px] border border-fp-line bg-white/82 shadow-soft" />
          <span className="absolute bottom-20 left-[108px] h-8 w-9 rounded-t-[8px] bg-fp-shared/58 [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        </div>

        <div className="absolute bottom-9 left-[14%] right-[18%] h-3 rounded-full bg-fp-ink/8" />
      </div>
    </div>
  );
}
