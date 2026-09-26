# Instagram package

Use the five numbered images in `instagram-4x5/` in order. Each is **1080 × 1350 (4:5)**, with branding and CTA inside the frame. `contact-sheet.png` is only a review sheet; do not upload it as a slide.

Copy `caption.txt`. The final slide asks viewers to comment **CODE** for the link. `comment-dm-templates.md` contains manual response templates; no messages are sent automatically.

The reel files are `inside-the-shot-reel-9x16.mp4` (1080 × 1920) and `inside-the-shot-reel-4x5.mp4` (1080 × 1350). Use 9:16 for full-screen Reels. Choose the 4:5 version if publishing as a portrait feed video. Titles remain in safe areas. All machine visuals come from the included original Blender geometry. No third-party music is included; add a licensed track in Instagram if desired.

## Reproduction

1. Rebuild stills using `BUILD.md`.
2. Render footage: `blender --background public/model/arc.blend --python blender/render_footage.py`.
3. Encode it: `python marketing/encode.py` (FFmpeg on PATH or `pip install imageio-ffmpeg`).
4. Render slides: `npm run instagram`.
5. In a Higgsfield sandbox with native Higgsedit, run `higgsedit build marketing/reel.jsx` from the project root. Set `REEL_FORMAT=4x5` for the feed export; the default is 9:16. `PREVIEW_ONLY=1` exports still previews without encoding the final movie. Preserve files by uploading results before the sandbox expires.

The editable JSX composition uses short crossfades, staggered title entrances, a continuous progress line and a held CTA. The generated native project folders are local build products, not a hosted editor link. The source JSX and source footage are included for reproduction.

On carousel upload, select all five matching 4:5 images and inspect the first/last slide preview before publishing. No extra cropping or zoom should be needed.
