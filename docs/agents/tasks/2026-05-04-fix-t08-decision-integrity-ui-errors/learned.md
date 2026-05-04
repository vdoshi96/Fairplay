# Learned

- Guided check-in radar agenda items already carry a linked `responsibilityId` when the radar source is tied to a responsibility, so the service can validate both responsibility items and radar-linked items through the same agenda item field.
- A Prisma transaction can prevent orphan check-in decisions by creating the decision and linking the item in one operation guarded by item state and `decisionId: null`.
- The guided flow only cleared decision summary/review fields after a successful save, so wrapping mutations in `try`/`catch` preserves user-entered decision details naturally on failure.
