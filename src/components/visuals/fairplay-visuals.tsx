/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

type VisualImageProps = {
  alt?: string;
  className?: string;
  decorative?: boolean;
};

type DecorativeBackgroundLayerProps = {
  className?: string;
  src: string;
  testId?: string;
  washClassName?: string;
};

type ResponsiveBackgroundLayerProps = Omit<
  DecorativeBackgroundLayerProps,
  "washClassName"
>;

type PersonaAvatarProps = VisualImageProps & {
  persona: "alex" | "max";
};

const personaAssets = {
  alex: {
    alt: "Alex avatar",
    height: 768,
    src: "/assets/fairplay/generated-ui/alex-avatar.png",
    width: 768
  },
  max: {
    alt: "Max avatar",
    height: 768,
    src: "/assets/fairplay/generated-ui/max-avatar.png",
    width: 768
  }
} as const;

function visualClass(className?: string) {
  return ["block h-auto max-w-full select-none", className].filter(Boolean).join(" ");
}

function classNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function variantPath(src: string, width: 768 | 1536, format: "avif" | "webp") {
  return `${src.replace(/\.png$/, "")}-${width}.${format}`;
}

function backgroundImageSet(
  src: string,
  variants: ReadonlyArray<{ density: 1 | 2; width: 768 | 1536 }>
) {
  return `image-set(${variants
    .flatMap(({ density, width }) => [
      `url('${variantPath(src, width, "avif")}') type('image/avif') ${density}x`,
      `url('${variantPath(src, width, "webp")}') type('image/webp') ${density}x`
    ])
    .join(", ")})`;
}

export function responsiveBackgroundStyle(src: string): CSSProperties {
  return {
    "--fp-background-desktop": backgroundImageSet(src, [
      { density: 1, width: 1536 }
    ]),
    "--fp-background-fallback": `url('${src}')`,
    "--fp-background-mobile": backgroundImageSet(src, [
      { density: 1, width: 768 },
      { density: 2, width: 1536 }
    ])
  } as CSSProperties;
}

export function ResponsiveBackgroundLayer({
  className,
  src,
  testId
}: ResponsiveBackgroundLayerProps) {
  return (
    <div
      aria-hidden="true"
      className={classNames(
        "fp-responsive-image-background pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat",
        className
      )}
      data-testid={testId}
      style={responsiveBackgroundStyle(src)}
    />
  );
}

export function DecorativeBackgroundLayer({
  className,
  src,
  testId,
  washClassName
}: DecorativeBackgroundLayerProps) {
  return (
    <div
      className={classNames(
        "fp-responsive-image-background pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat [mask-image:linear-gradient(115deg,black_0%,rgba(0,0,0,0.8)_55%,rgba(0,0,0,0.2)_100%)]",
        className
      )}
      aria-hidden="true"
      data-testid={testId}
      style={responsiveBackgroundStyle(src)}
    >
      {washClassName ? (
        <div className={classNames("absolute inset-0", washClassName)} />
      ) : null}
    </div>
  );
}

function VisualImage({
  alt,
  className,
  decorative = false,
  defaultAlt,
  height,
  width,
  src
}: VisualImageProps & { defaultAlt: string; height: number; src: string; width: number }) {
  return (
    <img
      alt={decorative ? "" : alt ?? defaultAlt}
      aria-hidden={decorative ? "true" : undefined}
      className={visualClass(className)}
      draggable={false}
      height={height}
      loading="lazy"
      src={src}
      width={width}
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
      height={asset.height}
      src={asset.src}
      width={asset.width}
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
      height={768}
      src="/assets/fairplay/generated-ui/helper-mascot.png"
      width={768}
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
      height={768}
      src="/assets/fairplay/generated-ui/fairplay-mark.png"
      width={768}
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
    <img
      alt={label}
      className={visualClass(
        ["fp-motion-checkin-spark rounded-[8px] object-contain", className]
          .filter(Boolean)
          .join(" ")
      )}
      data-fp-visual="check-in"
      draggable={false}
      height={640}
      loading="lazy"
      src="/assets/fairplay/generated-ui/check-in-spark.png"
      width={1024}
    />
  );
}
