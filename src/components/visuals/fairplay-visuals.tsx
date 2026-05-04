/* eslint-disable @next/next/no-img-element */
type VisualImageProps = {
  alt?: string;
  className?: string;
  decorative?: boolean;
};

type PersonaAvatarProps = VisualImageProps & {
  persona: "alex" | "max";
};

const personaAssets = {
  alex: {
    alt: "Alex avatar",
    src: "/assets/fairplay/alex-avatar.svg"
  },
  max: {
    alt: "Max avatar",
    src: "/assets/fairplay/max-avatar.svg"
  }
} as const;

function visualClass(className?: string) {
  return ["block h-auto max-w-full select-none", className].filter(Boolean).join(" ");
}

function VisualImage({
  alt,
  className,
  decorative = false,
  defaultAlt,
  src
}: VisualImageProps & { defaultAlt: string; src: string }) {
  return (
    <img
      alt={decorative ? "" : alt ?? defaultAlt}
      aria-hidden={decorative ? "true" : undefined}
      className={visualClass(className)}
      draggable={false}
      loading="lazy"
      src={src}
    />
  );
}

export function PersonaAvatar({
  alt,
  className,
  decorative,
  persona
}: PersonaAvatarProps) {
  const asset = personaAssets[persona];

  return (
    <VisualImage
      alt={alt}
      className={className}
      decorative={decorative}
      defaultAlt={asset.alt}
      src={asset.src}
    />
  );
}

export function HelperMascot({ alt, className, decorative }: VisualImageProps) {
  return (
    <VisualImage
      alt={alt}
      className={className}
      decorative={decorative}
      defaultAlt="Household helper mascot"
      src="/assets/fairplay/helper-mascot.svg"
    />
  );
}

export function RadarVisual({ alt, className, decorative }: VisualImageProps) {
  return (
    <VisualImage
      alt={alt}
      className={className}
      decorative={decorative}
      defaultAlt="Shared radar illustration"
      src="/assets/fairplay/radar-board-placeholder.svg"
    />
  );
}

export function FairplayMark({ alt, className, decorative }: VisualImageProps) {
  return (
    <VisualImage
      alt={alt}
      className={className}
      decorative={decorative}
      defaultAlt="Fairplay household orbit mark"
      src="/assets/fairplay/pwa-icon-concept.svg"
    />
  );
}

export function CheckInVisual({
  className,
  label = "Check-in spark"
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className={[
        "fp-motion-checkin-spark relative h-14 w-24 overflow-hidden rounded-[8px]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-fp-visual="check-in"
      role="img"
    >
      {[
        "left-[12%] top-[56%] bg-fp-alex",
        "left-[34%] top-[28%] bg-fp-helper",
        "left-[48%] top-[66%] bg-fp-shared",
        "left-[64%] top-[36%] bg-fp-max",
        "left-[78%] top-[58%] bg-fp-helper",
        "left-[54%] top-[18%] bg-fp-radar"
      ].map((pieceClass) => (
        <span
          aria-hidden="true"
          className={`absolute h-2.5 w-2.5 rounded-full ${pieceClass}`}
          data-testid="check-in-spark-piece"
          key={pieceClass}
        />
      ))}
    </div>
  );
}
