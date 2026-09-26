# Release verification

## Automated checks

- Eleven Node tests cover blocked removal without mutation; valid dependency sequences; every removable part; anchored chassis; reset/flow state; unknown actions and parts; manifest cycles; prepared routing; Responses API schema and failed output; GLB semantic groups/geometry; and HTTP host/origin, body-size, JSON, rate-limit and private-file protections.
- `npm run check`: tests and production build pass.
- `npm audit --registry=https://registry.npmjs.org`: zero vulnerabilities at verification time.
- Export contains all fourteen named groups with geometry and rest transforms. Modifier evaluation fixes shading differences between Blender and GLB.
- Blender rest frame 1 and final frame 360 have identical group translations; frame 180 matches the manifest's converted offsets. The chassis remains at the origin.

## Visual and integration checks

Verified on 26 September 2026:

- Desktop browser: explode, water path, focused pump view, reset and successful part removal after prerequisites.
- Phone viewport: 390 × 844 override, with 375 CSS pixels of content after the scrollbar; document width equals scroll width, with no horizontal overflow. Completed the five-step pump-removal sequence through the UI. Screenshot included in `marketing/app-mobile.png`.
- Corrected a canvas intrinsic-size feedback issue on viewport changes and used the supported Three.js PCF shadow-map mode.
- Blender assembled/exploded renders and the actual 3D Jutsu revision 2 preview inspected. Cloud rest/peak/final translations checked against the part manifest. The small cloud preview uses eight samples; production marketing renders use local Blender at higher resolution.
- Five carousel PNGs at exactly 1080 × 1350, visually reviewed as a set. Cover branding and final CTA remain inside the canvas.
- Native Higgsedit title/layout previews reviewed at both 1080 × 1920 and 1080 × 1350. Final 27-second exports are inspected and decoded before packaging.
- GitHub Actions passes Node tests, production build and dependency audit. Gitleaks reports no secrets in the published history.

The marketing package uses actual rendered geometry, not unrelated concept images. No Instagram post or DM is sent by this project.

The optional OpenAI interpreter is tested with HTTP fixtures, including invalid responses. A paid live OpenAI request is not part of these checks; account/model availability must be verified with your own configured key. Prepared mode is fully functional without credentials.

This is not a physical machine validation. No fluid, thermal or collision simulation is claimed. The scene is an original educational concept and has not been manufactured.


## Material / lighting update — 2026-09-26

- Seventeen Node tests pass, including new schema bounds, GLB material-role matching, provider refusals/errors, incomplete responses, shared concurrency limits and disabled-without-key behavior.
- Production build succeeds. Area-light lookup tables bring the main bundle to about 289 KB gzip; the Vite size advisory remains documented.
- Browser checked at desktop and 390 × 844: three presets, brightness, Undo, JSON Load, assembled/exploded views, and preservation of finishes through assembly actions. No horizontal mobile overflow or browser warnings/errors in the checked run.
- API-to-browser success and failure paths were exercised on a separate local fixture server. Valid settings reached the renderer; an injected failure preserved the last look. These were fixture tests, not live model generations.
- **No OpenAI key is configured in this project. A real paid AI design call has not been executed.** The UI clearly disables generation and explains setup; presets remain usable.
- No Higgsfield image/video/3D generation credits were spent for this update. The cloud scene and original Blender/carousel/reel assets retain their original appearance; the update adds a runtime studio to the web app.
