# Learned

- The T02 enum arrays match the implementation plan exactly and are exposed through Zod schemas and TypeScript types.
- Radar publishing is modeled as a dedicated mutation that requires `confirmPrivateDraftPublish` for `private` to `shared_household`, `partner_visible`, or `check_in_only`.
- Generic radar updates intentionally omit `visibility`, which preserves the publish-confirmation path.
- Responsibility updates still include a direct optional `visibility` field without transition context or confirmation; that conflicts with the global visibility-transition rule if private responsibility records are accepted by the contract.
- The reviewed seed content is limited to the approved eight area keys and eight example titles, with short original summaries and `sourceReviewStatus: "approved_original"`.
- Load signals return aggregate counts and distributions only; no partner scores, winner/loser fields, grades, or diagnostic labels were found in the helper output.
