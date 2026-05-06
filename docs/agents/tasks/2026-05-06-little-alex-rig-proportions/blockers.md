# Blockers

- Resolved: the isolated QA branch initially failed because the old rig left an `8.0px` head/torso gap before the proportions branch was merged.
- Resolved: integrated QA then caught only `6.0px` of arm/torso shoulder overlap. The asset-fit branch moved arm anchors inward and trimmed transparent Qwen padding so the connected figure passes the visual geometry checks.
- Resolved: user visual review correctly found that wrapper geometry QA was still insufficient because the actual rendered pieces had limb gaps and duplicate clipboard art. The coherent full-body branch switched the visible character to one full-body generated sprite per variant and added pixel-recognition QA against the actual image pixels.
- Resolved: user visual review later caught that the legacy body-part image DOM path could still show the disconnected paper-doll rig. The render path now removes those image nodes entirely and e2e asserts no body-part wrapper can contain an image child.
