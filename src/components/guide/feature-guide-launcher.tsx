"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureGuideHelper } from "./feature-guide-helper";
import { GuidedTour } from "./guided-tour";
import type { FeatureGuide } from "./guide-content";

type FeatureGuideLauncherProps = {
  guide: FeatureGuide;
  showDescription?: boolean;
};

export function FeatureGuideLauncher({
  guide,
  showDescription = true
}: FeatureGuideLauncherProps) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => searchParams.get("guide") === guide.id);

  return (
    <div className="flex max-w-full items-center gap-3">
      <FeatureGuideHelper guideId={guide.id} />
      <div className="grid min-w-0 gap-2">
        {showDescription ? (
          <p className="text-[14px] leading-5 text-fp-muted-ink">{guide.description}</p>
        ) : null}
        <Button className="justify-self-start" onClick={() => setIsOpen(true)}>
          <PlayCircle aria-hidden className="h-4 w-4 shrink-0" />
          <span>Learn this feature</span>
        </Button>
      </div>

      {isOpen ? (
        <GuidedTour
          featureName={guide.title}
          onExit={() => setIsOpen(false)}
          steps={guide.steps}
        />
      ) : null}
    </div>
  );
}
