import { CardLibrary } from "@/components/library/card-library";
import type { CardTemplateSummary } from "@/contracts/card-templates";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";

export default function LibraryPage() {
  const templates: CardTemplateSummary[] = FAIRPLAY_SOURCE_CARDS.map((card) => ({
    id: card.id,
    slug: card.slug,
    title: card.title,
    labels: card.labels,
    summary: card.summary,
    coverAssetPath: card.coverAssetPath,
    defaultLane: card.defaultLane
  }));

  return (
    <main className="grid gap-5">
      <div className="grid gap-1">
        <p className="text-[13px] font-semibold text-fp-muted-ink">Card library</p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Source deck
        </h1>
      </div>
      <CardLibrary templates={templates} />
    </main>
  );
}
