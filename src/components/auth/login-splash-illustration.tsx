/* eslint-disable @next/next/no-img-element */
export function LoginSplashIllustration() {
  return (
    <div
      aria-label="Animated Fairplay household garden scene"
      className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-fp-line bg-[#fff7e7] shadow-soft"
      role="img"
    >
      <div
        aria-hidden="true"
        className="fp-motion-card-float absolute inset-0"
        data-testid="login-splash-art-frame"
      >
        <img
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          data-testid="login-splash-image"
          draggable={false}
          height={1152}
          loading="eager"
          src="/assets/fairplay/generated-ui/login-household-garden.png"
          width={1536}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,253,248,0.18)_58%,rgba(32,33,42,0.08))]" />
    </div>
  );
}
