"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureGuideHelper } from "./feature-guide-helper";
import { GuidedTour } from "./guided-tour";
import type { FeatureGuide } from "./guide-content";

type FeatureGuideLauncherProps = {
  guide: FeatureGuide;
  showDescription?: boolean;
  showHelper?: boolean;
};

export function FeatureGuideLauncher({
  guide,
  showDescription = true,
  showHelper = true
}: FeatureGuideLauncherProps) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => searchParams.get("guide") === guide.id);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  return (
    <div className="flex max-w-full items-center gap-3">
      {showHelper ? <FeatureGuideHelper guideId={guide.id} /> : null}
      <div className="grid min-w-0 gap-2">
        {showDescription ? (
          <p className="text-[14px] leading-5 text-fp-muted-ink">{guide.description}</p>
        ) : null}
        <div
          data-feature-guide-action="primary"
          data-testid={`feature-guide-action-${guide.id}`}
        >
          <Button className="w-full sm:w-auto" onClick={() => setIsOpen(true)}>
            <PlayCircle aria-hidden className="h-4 w-4 shrink-0" />
            <span>Learn this feature</span>
          </Button>
        </div>
      </div>

      {isOpen && portalRoot
        ? createPortal(
            <GuidedTour
              featureName={guide.title}
              onExit={() => setIsOpen(false)}
              steps={guide.steps}
            />,
            portalRoot
          )
        : null}
    </div>
  );
}
