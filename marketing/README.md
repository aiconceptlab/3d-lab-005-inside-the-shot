# Instagram package

## Current release: Inside Anything

Use the five numbered PNGs in **instagram-inside-anything-4x5/**. Each is exactly **1080 × 1350 (4:5)**. Select all five from this folder; do not mix them with older layouts. `inside-anything-contact-sheet.png` is a review sheet, not an upload slide.

Copy **caption-inside-anything.txt**. The final slide asks viewers to comment **CODE** to get the link. Existing `comment-dm-templates.md` contains manual response templates. Nothing is posted or messaged automatically.

The refreshed cover uses AI-enhanced editorial artwork based on the original chair, labelled AI CONCEPT ARTWORK. Its richer walnut grain and upholstery are promotional art, not a screenshot of the app or a claim of generated mesh fidelity. The other chair/fan imagery is rendered from the included original Blender models. App screenshots show the actual running upload-based implementation. Prepared examples and approximate geometry are identified in the copy; they are not presented as proven automatic image reconstructions.

`npm run instagram` reproduces this carousel. Keep the full 4:5 frame on upload so the AI Concept Lab header remains visible.

## Earlier edition

`instagram-4x5/`, `caption.txt`, the `inside-the-shot-reel-*` videos and `reel.jsx` document the earlier fixed espresso-machine lab. They remain for existing users and are not the current upload-workflow marketing package. The original reel's repair/dependency demonstration belongs to that earlier interface.

## Refreshed reel

- `inside-anything-reel-4x5.mp4`: 1080 × 1350, feed format.
- `inside-anything-reel-9x16.mp4`: 1080 × 1920, full-screen Reels.
- Matching `inside-anything-reel-cover-*` PNGs and `inside-anything-reel-contact-sheet.png` are included.

Both are 22.4 seconds, 30 fps, H.264 / yuv420p. The native Higgsedit composition uses crossfades, staggered title entrances and a continuous progress line. It is an animated showcase of actual Blender stills and an actual app screenshot, not footage of a live automatic reconstruction. It contains no narration or third-party music; add a licensed soundtrack in Instagram if desired.

To reproduce in a Higgsfield sandbox with native Higgsedit, run `higgsedit build marketing/reel-inside-anything.jsx` from the repository root. The default is 4:5; use `REEL_FORMAT=9x16` for the tall version. `PREVIEW_ONLY=1` renders the cover without encoding a movie. Download/export outputs before the sandbox expires. The source composition is included; no generative image/video retries are needed for this edit.
