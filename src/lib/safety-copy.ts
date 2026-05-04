export const SAFETY_COPY = {
  nonClinicalBoundary:
    "Fairplay helps households organize responsibilities, expectations, and check-ins. It does not provide therapy, diagnosis, crisis support, or legal, medical, or financial advice.",
  unsafeRelationshipCaution:
    "Use shared notes only when it feels reasonably safe to do so. If sharing household plans could create risk, keep the note private and seek trusted local or professional support.",
  privateDraftPublishConfirmation:
    "This was private to your current persona view. Publishing it will make it visible in the selected shared space. Continue only if that is what you intend.",
  deferOrPause:
    "It is okay to pause or defer this topic. Choose a next review time when the household has enough capacity to return to it."
} as const;

export type SafetyCopyKey = keyof typeof SAFETY_COPY;
