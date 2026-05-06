import type { CardDetailCard } from "@/components/cards/card-detail-sheet";
import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import { FAIRPLAY_SOURCE_CARDS } from "@/seed/fairplay-source-cards";

const aiDraftCoverPathPattern =
  /^\/api\/ai-card-drafts\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/cover$/i;

export function detailCardFor(responsibility: ResponsibilityDetail): CardDetailCard {
  const sourceCard = FAIRPLAY_SOURCE_CARDS.find(
    (card) => normalize(card.title) === normalize(responsibility.title)
  );
  const sourceCoverAssetPath = responsibility.sourceCoverAssetPath ?? null;
  const isGeneratedCover = aiDraftCoverPathPattern.test(sourceCoverAssetPath ?? "");
  const sourceFields = isGeneratedCover
    ? {
        definition: responsibility.sourceDefinition ?? responsibility.summary,
        conception:
          responsibility.sourceConception ??
          responsibility.lifecycleNotes?.noticeDecideNotes ??
          null,
        planning:
          responsibility.sourcePlanning ??
          responsibility.lifecycleNotes?.planPrepareNotes ??
          null,
        execution:
          responsibility.sourceExecution ??
          responsibility.lifecycleNotes?.executeFollowThroughNotes ??
          null,
        minimumStandard: responsibility.sourceMinimumStandard ?? null
      }
    : {
        definition:
          sourceCard?.definition ?? responsibility.sourceDefinition ?? responsibility.summary,
        conception:
          sourceCard?.conception ??
          responsibility.sourceConception ??
          responsibility.lifecycleNotes?.noticeDecideNotes ??
          null,
        planning:
          sourceCard?.planning ??
          responsibility.sourcePlanning ??
          responsibility.lifecycleNotes?.planPrepareNotes ??
          null,
        execution:
          sourceCard?.execution ??
          responsibility.sourceExecution ??
          responsibility.lifecycleNotes?.executeFollowThroughNotes ??
          null,
        minimumStandard: sourceCard?.minimumStandard ?? responsibility.sourceMinimumStandard ?? null
      };

  return {
    id: responsibility.id,
    title: responsibility.title,
    labels: sourceCard?.labels ?? [],
    boardLane: responsibility.boardLane,
    ownerLabel: ownerLabelFor(responsibility),
    definition: sourceFields.definition,
    conception: sourceFields.conception,
    planning: sourceFields.planning,
    execution: sourceFields.execution,
    minimumStandard: sourceFields.minimumStandard,
    householdStandard: responsibility.householdStandard,
    notes: responsibility.notes,
    coverAssetPath: sourceCoverAssetPath ? null : sourceCard?.coverAssetPath ?? null,
    sourceCoverAssetPath
  };
}

function ownerLabelFor(responsibility: ResponsibilityDetail) {
  const owners = responsibility.currentAssignments.filter(
    (assignment) =>
      assignment.role === "accountable_owner" || assignment.role === "shared_owner"
  );

  if (owners.length === 0) {
    return "Unassigned";
  }

  return owners
    .map((assignment) =>
      assignment.personaKey
        .split("_")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
        .join(" ")
    )
    .join(" + ");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
