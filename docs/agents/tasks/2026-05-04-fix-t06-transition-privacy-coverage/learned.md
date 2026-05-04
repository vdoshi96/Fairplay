# Learned

- `ResponsibilityUpdateSchema` still included `status` and `currentAssignments`, so the generic PATCH route could pass transition-only fields to `responsibilityService.update`.
- `ResponsibilityEditor` reused one save body for generic edits and dedicated assignment/status flows, causing transition fields to ride along with ordinary edit saves.
- `responsibilityService.listOverview` loaded all household radar items through a dependency that only accepted `householdId`, so it could not enforce the same private draft visibility rule as `listRadarItemsForPersona`.
- Removing transition fields from the public update contract also required decoupling the internal repository update input, because dedicated status transitions still need to persist `status` and `archivedAt`.
