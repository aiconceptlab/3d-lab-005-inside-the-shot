# Release verification — Inside Anything v2

Verified 2026-09-27.

## Passed locally

- 23 automated tests: existing material/legacy behavior plus generic scene validation, source citations, primitive limits, photo-only exterior restrictions, knowledge-only restrictions, named GLB nodes, upload/import/review/build/export, project isolation, provider single-flight behavior and failure handling.
- Vision adapter fixture tests verify image inputs, strict schemas, no stored Responses, request provenance, HTTP failure/incomplete-response handling and rejected nonexistent source/part IDs. Fixtures are not live AI verification.
- Production build succeeds. Three.js produces an expected bundle-size advisory (~291 KB gzip).
- Actual fan PDF uploaded through the browser, scene JSON imported, labels reviewed and a new Blender build generated. Its own GLB loads in the viewer; no ARC fallback occurs.
- Chair part selection opens the correct original manual page. All four sample PDF pages were visually inspected after resolving packaged PDF fonts.
- Generic chair and fan `.blend` files checked at frames 1, 100 and 180: anchored parts remain fixed; others separate; all return exactly to rest.
- Chair, fan and original ARC keep named semantic model groups. Generic material roles are retained in the exports.
- Browser checks: desktop assembly, explosion, source-page dialog, fan material preset, mobile layout at 390 × 844 with no horizontal overflow. App screenshots are included in marketing/.
- A separate chair scene built successfully in managed Higgsfield 3D Jutsu; its actual exploded render was visually inspected. Cloud Blender version 5.2; local version 4.5.9 LTS.
- Every refreshed carousel slide is exactly 1080 × 1350, with brand and CTA inside the frame. Final CTA is Comment “CODE”.

## Boundaries

No live OpenAI key was configured during verification. Automatic source analysis, live source questions and live look generation are implemented and tested with controlled provider responses, but no real OpenAI request is claimed. The fully exercised user path is manual upload → assistant-style scene import → local Blender → browser exploration.

Chair/fan inputs and scenes are original authored fixtures. They test portability and source handling; they do not demonstrate that a vision model can reconstruct every object. Complex shapes, unknown internals, engineering tolerances and safe repair sequences are outside this POC.

Photo-only and knowledge-only outcomes have automated validation coverage. Live classification quality across arbitrary uploaded manuals remains a follow-up check requiring a configured vision model. PDF text extraction supports embedded text; scanned pages rely on vision rather than independent local OCR.

The server is local and single-user. Worker timeouts and bounded schemas reduce accidental load; they do not make native PDF/Blender processing a hardened internet-facing sandbox.

## Release checks

- GitHub Actions passed the published implementation build, tests and dependency audit.
- Gitleaks scanned the staged release and found no credentials. `.env`, uploads and private job/build storage are excluded from Git.
- The actual uploaded fan project ZIP was opened and checked for scene/project metadata, original PDF, page images, GLB and editable Blender file.
- Refreshed reel: 22.4 seconds, 30 fps, H.264 / yuv420p; 4:5 and 9:16 variants. Cover and five scene frames were visually inspected. The edit uses actual stills/screenshots; it is not a claim of live source reconstruction footage.
