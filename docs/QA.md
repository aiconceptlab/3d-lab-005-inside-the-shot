# Release verification

## Automated checks

- Eleven Node tests cover blocked removal without mutation; valid dependency sequences; every removable part; anchored chassis; reset/flow state; unknown actions and parts; manifest cycles; prepared routing; Responses API schema and failed output; GLB semantic groups/geometry; and HTTP host/origin, body-size, JSON, rate-limit and private-file protections.
- `npm run check`: tests and production build pass.
- `npm audit --registry=https://registry.npmjs.org`: zero vulnerabilities at verification time.
- Export contains all fourteen named groups with geometry and rest transforms. Modifier evaluation fixes shading differences between Blender and GLB.
- Blender rest frame 1 and final frame 360 have identical group translations; frame 180 matches the manifest's converted offsets. The chassis remains at the origin.

## Visual and integration checks

Blender renders, desktop/mobile browser behaviour, carousel exports and final reel frames are checked before release. The marketing package uses actual rendered geometry, not unrelated concept images. Carousel dimensions are exactly 1080 × 1350.

The optional OpenAI interpreter is tested with HTTP fixtures, including invalid responses. A paid live OpenAI request is not part of these checks; account/model availability must be verified with your own configured key. Prepared mode is fully functional without credentials.

This is not a physical machine validation. No fluid, thermal or collision simulation is claimed. The scene is an original educational concept and has not been manufactured.
