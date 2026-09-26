# Build and extend

## Architecture

`parts.json` is the shared contract: semantic ID, explanation, exploded offset in glTF coordinates and required removals. `manual.mjs` validates it and applies commands without mutating prior state. `scene.mjs` animates named GLB groups using those offsets. `main.mjs` connects UI, prepared commands and optional live interpretation.

The `.blend` uses Blender Z-up metres. glTF and the browser use Y-up; offset conversion is `(x, z, -y)`. The GLB exports in the rest pose. Browser controls animate positions; the editable Blender file additionally includes a 360-frame / 30 fps assembly animation.

## Rebuild the actual model

Install Blender from https://www.blender.org/download/ (verified locally with 4.5.9 LTS; the cloud scene uses 5.2). Run from the repository root:

```sh
blender --background --python blender/build_scene.py -- --out public/model --renders
```

PowerShell with an explicit installed executable:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe' --background --python blender/build_scene.py -- --out public/model --renders
```

Replace that example path with your own installation. The script creates a new scene in that background process and writes `arc.blend`, `arc.glb`, `parts.json`, `assembled.png` and `exploded.png`. It does not control or overwrite an already-open Blender window. Export applies bevel and weighted-normal modifiers so the browser geometry matches the rendered geometry. Authoring modifiers remain editable in the `.blend`.

To change the object, edit the semantic `group(...)` definitions and child geometry in `build_scene.py`, regenerate both model and metadata, run tests, then rebuild the frontend. New group IDs must remain consistent across the GLB and the manifest. Keep dependency edges acyclic. The chassis remains fixed.

## Local development

`npm run dev` runs Vite for prepared-mode frontend changes. Use `npm run build && npm start` to test the complete server and optional language endpoint. `/api/config` exposes only whether live interpretation is configured. No credentials enter the frontend bundle.

## Reproduce marketing

`npm run instagram` lays out the five PNGs at exactly 1080 × 1350 using actual renders. See `marketing/README.md` for the Blender footage and native Higgsedit composition. Keep every carousel slide at the same 4:5 ratio. Use the supplied 9:16 reel for full-screen playback or the 4:5 variant for the feed.

## Official references checked for this build

- [Higgsfield 3D Jutsu](https://higgsfield.ai/blog/higgsfield-3d-jutsu): editable scenes and exports
- [Higgsfield MCP](https://higgsfield.ai/mcp): connection endpoint and workflows
- [Exploded-view workflow](https://higgsfield.ai/mcp/exploded-view?tab=claude)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html)
- [Anime.js animation](https://animejs.com/documentation/animation/)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [GPT-5.4 mini model](https://developers.openai.com/api/docs/models/gpt-5.4-mini): optional API model example; access depends on your account

Dependencies are pinned in `package-lock.json`. Platform availability and usage charges depend on the connected account.
