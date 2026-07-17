import Image from "next/image";

import type { CardWorkspaceCard } from "./card-workspace-types";

export function CardCoverImage({
  card,
  className
}: {
  card: CardWorkspaceCard;
  className?: string;
}) {
  if (!card.sourceCoverAssetPath) {
    return (
      <div
        aria-label={`${card.title} cover`}
        className={[
          "grid place-items-center overflow-hidden text-center text-[12px] font-bold text-fp-muted-ink",
          className ?? ""
        ].join(" ")}
        role="img"
      >
        <span className="px-2">Card cover</span>
      </div>
    );
  }

  const isPrivateGeneratedCover = card.sourceCoverAssetPath.startsWith("/api/");

  return (
    <div className={["overflow-hidden", className ?? ""].join(" ")}>
      <Image
        alt={`${card.title} cover`}
        className="h-full w-full object-contain"
        height={700}
        sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 82vw"
        src={card.sourceCoverAssetPath}
        unoptimized={isPrivateGeneratedCover}
        width={500}
      />
    </div>
  );
}
