# Upload-driven 3D Lab — implementation plan

Status: implemented as an assisted-first v2 prototype, 2026-09-27. See README and QA for the delivered scope. The live automatic-vision acceptance gate remains unverified without a configured API key. Arbitrary external-GLB import and engineering-quality reconstruction are not included.

## Product

Working name: Inside Anything — AI Concept Lab, 3D LAB // 005.
Hook: Upload the product. Explore how it comes together.
The ARC espresso machine becomes one sample project. The home screen starts with image/PDF upload and a Try an example action. Support many object categories without advertising guaranteed reconstruction of every object.

User journey: upload photo(s) and/or manual → inspect extracted evidence → generate a preview → explore parts, ask questions, change finishes → save/export.

## Output depends on the evidence

- Photos alone: generate an approximate exterior model and identify visible features. Dimensions and hidden surfaces are inferred unless supplied. Do not manufacture internal components merely to offer an Explode button.
- Illustrated manual or parts diagram: extract named parts, assembly illustrations and page citations. Attempt an editable conceptual assembly with separate named objects. Show uncertainty for shape/placement that is not specified.
- Photos plus illustrated manual: combine appearance references with documented part knowledge; preferred demo path.
- Text-only or insufficient sources: deliver a grounded parts/knowledge view, request the specific missing view or diagram, and offer an explicitly labelled schematic where useful. Do not silently present an invented detailed model as a reconstruction.

Part evidence categories: visible in source image, documented on a manual page, inferred for visualization. Keep geometry confidence separate from confidence in the part's identity. Avoid unsupported percentage accuracy scores.

## First milestone: prove the generation pipeline

Before expanding the UI, run one end-to-end pilot on a simple object with a clear assembly diagram. Compare the source with assembled and exploded renders. Confirm that the output has meaningful separate meshes, stable part IDs and a plausible assembled rest pose. A textured image-to-3D model alone does not meet the assembly requirement.

Use image-to-3D for exterior reconstruction where suitable. Use an evidence-based scene specification and Blender/3D Jutsu to construct named component geometry when the source supports an assembly. Any automated segmentation or component-generation route must be verified on the pilot, not assumed from a model's GLB output.

Keep a second, unrelated object as an early portability check. If reliable part separation fails, scope v1 to exterior exploration plus sourced manual knowledge and reserve Explode for successfully constructed assemblies.

## Architecture changes

1. Project storage: replace the single fixed /model/arc.glb path with per-project source files, source page thumbnails, extracted evidence, model.glb, scene manifest, material roles, saved looks and generation job records. The original model is a sample project.
2. Ingestion: validate image/PDF file signatures and sizes, bound image resolution/page count and processing time, render PDF pages, extract text/OCR as needed, preserve page IDs. Treat document content as data, not generation-system instructions. Explain which uploads are sent to each provider.
3. Evidence extraction: a vision/document model proposes object identity, part catalogue, cited evidence, dimensions where explicit, uncertainty and available interactions. Let users correct important findings before spending generation credits.
4. Scene specification: store model URL, units/scale basis, bounds, part-to-node mapping, labels/aliases, source references, rest transforms, explosion offsets, anchored flags, supported actions, material roles and optional process routes. Validate node coverage, finite transforms and dependency cycles. Record source-supported assembly steps separately from presentation animation order.
5. Generation adapter: asynchronous jobs with progress, provider/model provenance, cached source hashes, persisted job IDs, capped retries and downloadable artifacts. Reuse successful results. Regenerate selected stages rather than the whole project. Show cost estimates when available and an explicit budget boundary before paid submissions; an unknown estimate is not zero.
6. Blender build: generate/edit a scene in an isolated worker; never execute unrestricted model-generated Python on the user's host. Prefer a bounded scene specification consumed by trusted builder code. Export named GLB groups and an editable Blender scene when supported. Capture and inspect assembled/exploded previews.
7. Viewer: calculate camera, lights, stage and orbit limits from model bounds. Build parts, aliases and interaction buttons from the manifest. Enable Explode only for valid separate parts; enable process animation only when a route exists. Replace the hardcoded chassis/pump checks and material names. Keep cinematic lighting, design presets and save/load.
8. Grounded assistant: retrieve relevant manual pages and refer to actual manifest part IDs; clicking an answer highlights the part and offers the source page. Admit missing evidence. Offer documented assembly steps where available; do not turn a guessed animation order into repair instructions.

## Integration boundary

The connected Higgsfield tools available to Codex are not automatically available to visitors of a standalone web app. First verify a supported server-side API/authentication path for the exact image-to-3D and Jutsu operations needed. Keep credentials on the server.

If that path is unavailable, explicitly ship an agent-assisted generation workflow: the app creates a source package, a connected assistant runs the documented MCP workflow, then the resulting model/manifest is imported. This is useful but must not be advertised as automatic in-app generation. Full one-click generation is a release gate requiring a tested provider adapter.

## Delivery sequence

A. Feasibility and provider-auth spike: source → separate parts → Blender/GLB → verified preview, plus a tested standalone job adapter or explicit assisted-mode decision.
B. Generic project/manifest refactor: migrate ARC; add a second fixture; preserve current interactions and looks.
C. Upload, extraction and evidence review: include source citations and an honest low-information fallback.
D. Generation jobs and generic viewer: end-to-end generation, progress, retry/budget handling, project persistence and export.
E. Product polish and release: test source-grounded questions and material customization across categories; update README, BUILD, .env.example and MCP instructions; secret-scan and publish code; refresh 4:5 carousel and reel from actual outputs.

## Acceptance criteria

- Demonstrate at least three unrelated categories, such as a chair, desk fan and coffee machine, using appropriately permitted sources.
- Test photo-only, illustrated-PDF-only, combined sources and a text-only/insufficient manual.
- A fresh upload creates its own project and never accidentally displays ARC as its result.
- Any offered Explode action separates real named groups and returns them exactly to their rest transforms. It is described as a conceptual visualization, not a collision simulation.
- Manual claims link to the correct page; an unsupported question produces a clear unknown response. Invented internal parts are not labelled as documented.
- Material edits preserve node/part IDs; dynamic scenes frame correctly on desktop and mobile.
- Failed jobs retain uploads and successful stages; retries do not unknowingly duplicate paid submissions.
- Test malformed/oversized files, hostile document instructions, invalid model outputs, credential isolation and project isolation.
- Verify at least one real provider generation end to end before calling the automatic workflow complete. Fixtures alone are insufficient evidence.

## Sources checked while planning

- Higgsfield exploded-view workflow: https://higgsfield.ai/mcp/exploded-view?tab=claude — describes animation of an existing Blender scene; it does not establish arbitrary-photo internal reconstruction.
- Higgsfield MCP connection documentation: https://higgsfield.ai/mcp
- OpenAI file inputs: https://developers.openai.com/api/docs/guides/file-inputs
- Connected Higgsfield model catalogue, 2026-09-27: Meshy 7 image-to-3D exposes GLB generation with optional textures/PBR; meaningful semantic part separation is not a declared guarantee.
