export function LoginSplashIllustration() {
  return (
    <div
      aria-label="Animated Fairplay household garden scene"
      className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card-muted)] shadow-[var(--fp-shadow-crisp)]"
      role="img"
    >
      <div
        aria-hidden="true"
        className="fp-motion-card-float absolute inset-0"
        data-testid="login-splash-art-frame"
      >
        <picture className="block h-full w-full">
          <source
            media="(max-width: 767px)"
            srcSet="/assets/fairplay/generated-ui/login-household-garden-768.avif 1x, /assets/fairplay/generated-ui/login-household-garden-1536.avif 2x"
            type="image/avif"
          />
          <source
            media="(max-width: 767px)"
            srcSet="/assets/fairplay/generated-ui/login-household-garden-768.webp 1x, /assets/fairplay/generated-ui/login-household-garden-1536.webp 2x"
            type="image/webp"
          />
          <source
            srcSet="/assets/fairplay/generated-ui/login-household-garden-1536.avif"
            type="image/avif"
          />
          <source
            srcSet="/assets/fairplay/generated-ui/login-household-garden-1536.webp"
            type="image/webp"
          />
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
        </picture>
      </div>
      <div className="fp-asset-edge-wash pointer-events-none absolute inset-0" />
    </div>
  );
}
