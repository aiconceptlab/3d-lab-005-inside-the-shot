# Build and extend Inside Anything

## Architecture

`server/store.mjs` stores a private project directory per UUID. `server/ingest-worker.mjs` validates image content and renders PDFs using PDF.js + a native canvas in a bounded worker. PNG page previews and extracted text become the shared evidence inventory.

`server/vision.mjs` submits those pages to OpenAI Responses with a strict schema, or writes the instructions included in an assistant package. `src/project.mjs` independently validates part IDs, evidence references, quotes, numeric bounds, primitive counts and material roles. Scene JSON cannot supply executable code, URLs or filesystem paths.

`server/lab-api.mjs` owns the asynchronous analysis/build lifecycle. A persisted job records status and source-analysis attempts. One source provider call runs at a time; retry is explicit and bounded. On restart, interrupted jobs return to review/uploaded status without another API call. Uploads are retained on failure.

`src/geometry.mjs` creates a browser preview from the scene. `blender/build_project.py` creates equivalent named parts, bevelled geometry, materials, animation and GLB/Blender exports. `server/build.mjs` launches only that trusted script. A failed/unconfigured Blender build leaves an explicit browser-preview path; it never substitutes the espresso-machine model.

`src/scene.mjs` frames arbitrary project bounds, maps semantic parts to nodes, animates validated offsets, handles source materials and adds studio lighting. `src/main.mjs` connects upload, review, source citations and project persistence. `src/look.mjs` validates the four generic material roles (`body`, `metal`, `accent`, `detail`).

## Local Blender build

Install Blender from its official website. Tested locally with 4.5.9 LTS and in Higgsfield with Blender 5.2. From the repository root:

```sh
blender --background --factory-startup --disable-autoexec --python blender/build_project.py -- --scene public/samples/chair/scene.json --out public/samples/chair --renders
```

PowerShell executable paths with spaces need `& 'C:/path/to/blender.exe'` before the arguments. The command writes `model.glb`, `model.blend`, `assembled.png` and `exploded.png`. It operates in a fresh background process; it does not edit an already-open Blender window.

The schema uses metre units, Y up, front +Z. Blender conversion is `(x, -z, y)`. Parts share world coordinates and receive independent named parent groups. Frames 1 and 180 are assembled; frame 100 shows the exploded hold. This animation is a conceptual presentation, not collision checking or safe repair guidance. GLB is exported assembled; browser controls apply the same offsets.

Add `BLENDER_PATH` in `.env` to enable the same builder from **Build this concept**. The local worker has a 90-second timeout and does not receive API keys in its environment. It is a constrained subprocess, not an operating-system security sandbox. Keep the app local.

## Author another fixture

1. Produce scene JSON matching `SCENE_SCHEMA` in `src/project.mjs`.
2. Each documented/visible part must reference an existing source page ID. Text quotes must occur on that page. Geometry confidence is separate from evidence confidence.
3. Use no more than 24 parts and 240 total primitive elements; dimensions and transforms are bounded. The AI prompt asks for a smaller 18-part/100-element target.
4. Validate with `validateScene(scene, pages)` before passing it to the builder. Do not execute AI-generated scripts.
5. Inspect assembled and exploded renders. Check labels, silhouettes, separation, materials and rest positions.

`node scripts/create-examples.mjs` regenerates the authored chair/fan specs. After rebuilding their renders, `python scripts/create-manuals.py` regenerates the original PDFs (requires ReportLab). Sample page PNGs/text are produced through the same ingestion worker as uploads. These manuals describe original concepts; do not relabel them as manufacturer documents or automated vision results.

## API overview

- `GET /api/config`, `GET /api/examples`, `POST /api/examples/:slug`
- `GET/POST /api/projects` (upload uses JSON files with name + base64 data)
- `GET /api/projects/:id`
- `POST /api/projects/:id/analyze` with `budgetConfirmed: true`
- `POST /api/projects/:id/import-scene` with `{scene}`
- `POST /api/projects/:id/review` with `{title, parts:[{id,label}]}`
- `POST /api/projects/:id/build`
- `POST /api/projects/:id/ask` with `{text}`
- `GET /api/projects/:id/export` or `/assistant-package`
- `POST /api/design` with `{text}` for a bounded finish/light recipe

Poll a project's status after a 202 response. The UI does this automatically. Existing analysis is cached per project; `retry:true` deliberately requests another analysis and consumes its call budget. The current UI offers import/review rather than an automatic regenerate loop.

## Development and checks

Use `npm run build` then `npm start` for the complete app. Vite alone does not provide the project/API routes. `npm test` uses isolated temporary project storage and provider fixtures, never real credentials. `npm run check` runs tests and production build. The Three.js bundle is about 291 KB gzipped; the uncompressed-size advisory is expected for this local POC.

## Official integration references

Checked 2026-09-27:

- [Higgsfield MCP](https://higgsfield.ai/mcp) — published connection endpoint and Blender workflows
- [Higgsfield API docs](https://docs.higgsfield.ai/docs) — no standalone Jutsu endpoint verified for this release
- [OpenAI vision](https://developers.openai.com/api/docs/guides/images-vision) — rendered source pages as image inputs
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) — strict scene/answer schemas
- [PDF.js Node rendering example](https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)

PDF.js needs its packaged standard fonts, CMaps and WASM directory. The worker resolves them from the installed package; omitting standard fonts breaks some PDF text rendering.
