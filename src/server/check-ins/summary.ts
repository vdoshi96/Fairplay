type SummaryDecision = {
  summary: string;
  reviewOn?: string | null;
};

type SummaryInput = {
  decisions: SummaryDecision[];
  deferredItems: string[];
  skippedItems: string[];
};

const unsafeSummaryPattern =
  /\b(score|winner|loser|diagnosis|diagnose|clinical|therapy|therapeutic|blame|fault|failed|failure)\b/i;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function containsUnsafeSummaryLanguage(summary: string): boolean {
  return unsafeSummaryPattern.test(summary);
}

export function buildCheckInSummary(input: SummaryInput): string {
  const sections: string[] = [];

  if (input.decisions.length > 0) {
    const decisions = input.decisions
      .map((decision) => {
        const review = decision.reviewOn
          ? ` Next review: ${formatDate(decision.reviewOn)}.`
          : "";

        return `${decision.summary}${review}`;
      })
      .join(" ");
    sections.push(`Decisions: ${decisions}`);
  } else {
    sections.push("Decisions: No new decisions were recorded.");
  }

  if (input.deferredItems.length > 0) {
    sections.push(`Deferred: ${input.deferredItems.join("; ")}.`);
  }

  if (input.skippedItems.length > 0) {
    sections.push(`Skipped for now: ${input.skippedItems.join("; ")}.`);
  }

  return sections.join("\n");
}
