# Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun)
[![rank](https://make.fun/badge/gta6-cover-art-01/memelljk/vice-cover-studio-2/rank.svg)](https://make.fun)
[![reward](https://make.fun/badge/gta6-cover-art-01/memelljk/vice-cover-studio-2/reward.svg)](https://make.fun)

An offline browser studio that turns your photos and a caption into bold
GTA-style cover art: multi-panel layouts, a posterize + comic-outline +
sunset/neon gradient-map treatment for every photo, thick condensed
caption lettering, and a one-click PNG export in the three common post
sizes. Everything runs locally in the browser - photos never leave the
device, and the app makes no network requests.

## Features

- **5-panel multi-photo covers** - place a different photo in each panel, or fill every panel with one photo.
- **3 layouts** - Sunset Grid (hero + 4), Neon Strip (5 vertical strips), Vice Duo (2 slanted panels).
- **4 colour grades** - Sunset, Neon Nights, Vice Pink and Palm Noir gradient maps.
- **Poster treatment pipeline** - saturation/contrast push, posterize (3-9 levels), Sobel comic outline, optional halftone dots, vignette and film grain.
- **Per-photo crop** - click a panel, drag to reposition, slider to zoom.
- **Bold caption lettering** - bundled Anton typeface (SIL OFL), black outline, accent drop shadow, optional sub-caption band, top or bottom.
- **PNG export in 3 post sizes** - 1080x1080, 1080x1350 and 1920x1080.
- **Built-in demo scenes** - three procedural illustrations (portrait, beach, dusk drive) drawn by the app itself, so a finished cover is visible before any upload.

## Run it

Open `app/index.html` in a desktop browser, or serve the folder:

```
node serve.ts   # then open the local address it prints
```

## Entry program

`node main.ts` copies `app/` and `screenshots/` to the output directory
and writes `dossier.json` with the vendored make.fun library
(`vendor/makefun-app.ts`). Locally: `MAKEFUN_OUTPUT_DIR=out node main.ts`.

The Anton font is licensed under the SIL Open Font License 1.1; the
license text ships with the font in `app/fonts/OFL.txt`.
