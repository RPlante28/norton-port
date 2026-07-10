# ROHAN-DOS Portfolio — Project Notes

Working notes for continuing this project. Covers what it is, how to run and
deploy it, how the code is organized, what's done, and what's next.

---

## TL;DR — current state

- **What it is:** my portfolio, styled as a Norton Commander / DOS text-mode
  desktop (boot screen, two-pane file browser, CLI mode, a live 6502 CPU
  emulator, dithered photos, dialogs, easter eggs).
- **Stack:** the live app is **React + Vite + Tailwind**, fully modularized, all
  under the **`app/`** folder. It reproduces the original single-file design
  pixel-for-pixel and has had content + animation work layered on top.
- **Where it lives:** GitHub repo **`RPlante28/norton-port`**, on the
  **`portfolio-updates`** branch, mirrored to **`main`**.
- The repo **root still contains the older single-file site** (`index.html`,
  `content.js`, `animations.js`, `support.js`, `cpu6502.js`, `contact.php`,
  `assets/`, `uploads/`, `vendor/`). The `app/` build is the source of truth
  going forward; the root files are legacy and can be removed once nothing
  references them.
- **Deploys as a static site** to GoDaddy/cPanel. No server, no backend (except a
  one-file PHP mail script for the contact form).

---

## Run / build / deploy

```bash
cd app
npm install          # first time
npm run dev          # local dev server (http://localhost:5173), hot reload
npm run build        # production build -> app/dist/
npm run preview      # serve the production build (truest local test)
npm run lint         # ESLint (currently clean)
npm run format       # Prettier
npm run deploy       # build + zip dist/ into app/site.zip for cPanel
```

**Deploy:** `npm run deploy`, then in cPanel → File Manager → `public_html/` →
upload `site.zip` → Extract → delete the zip. (`site.zip` contains the *contents*
of `dist/` at its root, so files land directly in `public_html/`.) The build uses
`base: './'` (relative paths), so it also works from a subfolder.

**Local caveat:** the contact form POSTs to `contact.php`, which needs PHP — it
won't send in `npm run dev`/`preview` (works once deployed). Everything else
(boot, nav, 6502 VM, CLI, editor, images, dialogs) works fully offline.

---

## Architecture

The original app cleanly separated **logic** (one big `renderVals()` that returns
a `vals` object) from **view** (a template that consumed `vals`). The current
build preserves that seam.

### Directory map (`app/`)

| Path | What it is |
|------|-----------|
| `index.html` | Loads the 3 data scripts as classic `<script>`s, then the React entry. |
| `src/main.jsx` | Mounts `<App/>` (no StrictMode — the engine has real timers/audio). |
| `src/components/App.jsx` | Small composition of the shell + feature/dialog components. |
| `src/components/` | Shell chrome: `MenuBar`, `FilePanel`, `CommandLine`, `FunctionKeyBar`, `BootScreen`, `EditorOverlay`, `CliFullScreen`, `BossMode`, `ImageViewer`, `CrtOverlay`, `Screensaver`, `PrintResume`. |
| `src/features/` | Right-pane views: `RightPane` (switch) + `InfoCard`, `DirPreview`, `DocView`, `EduView`, `ContactView`, `TextView`, `Vm6502`. |
| `src/dialogs/` | Modal layer: `Dialogs` (switch) + `Config`, `About`, `Contact`, `Help`, `Dash`, `Resume`. |
| `src/engine/Engine.js` | **All app logic** (file browser, CLI commands, vim editor, 6502 VM, WebAudio, dialogs, boot). |
| `src/index.css` | Tailwind directives + DOS design tokens (`:root`) + `.nc-*` component classes + scrollbars/keyframes. |
| `scripts/pack.mjs` | The `deploy`/`pack` zipper (adm-zip). |
| `public/content.js` | **All portfolio text & projects.** Edit to change what the site says. |
| `public/animations.js` | **All ASCII animations** (frame → string functions). |
| `public/cpu6502.js` | The 6502 CPU emulator (PROGRAMS demo). |
| `public/contact.php` | Contact-form mail backend (`$TO_EMAIL` near the top). |
| `public/assets/`, `public/uploads/` | Images, ASCII portrait, résumé PDF. |

### Key concepts (read before editing)

1. **The engine is a faithful port.** `Engine.js` is the original single-file
   logic class, unchanged except a small store shim at the top:
   `subscribe` / `getSnapshot` / `setState` (synchronous merge + emit) /
   `forceUpdate` / `_emit`. React drives it via `useSyncExternalStore` + effects
   calling `componentDidMount` / `componentDidUpdate` / `componentWillUnmount`.
   **Prefer surgical edits here; don't reshape it.** (ESLint is relaxed for this
   file on purpose.)

2. **`renderVals()` is the bridge.** It returns one `vals` object; every React
   component just reads `v.*` from it. Handlers, refs, computed strings, list
   data — all come from `renderVals`. To add UI state, add a field there.

3. **Data files are classic scripts, not modules.** `content.js`,
   `animations.js`, `cpu6502.js` live in `public/`, are loaded via `<script>` in
   `index.html`, and expose `window.PORTFOLIO` / `window.VIZ` / `window.CPU6502`.
   This keeps the "edit one plain file to change content" workflow and copies them
   verbatim into `dist/` (still editable after a build). The engine reads the globals.

4. **Styling is Tailwind.** The DOS palette is Tailwind theme tokens
   (`text-cyan`, `bg-dos-blue`, `border-edge-dim`, `text-yellow`, `text-muted`,
   `text-dim`, …) mirrored in CSS `:root`. Repeated chrome lives in `.nc-*`
   classes in `index.css` (`.nc-btn`, `.nc-tag`, `.nc-frow`, `.nc-vbtn`,
   `.nc-dlgbtn`, `.nc-close`, `.nc-progress`, etc.). Only genuinely complex
   one-offs (filters, keyframe shorthands, multi-part box-shadows, gradients)
   remain as small inline `style={{…}}` objects — idiomatic, not a TODO.

---

## What's been done

- Faithful React/Vite/Tailwind port of the entire app; verified pixel-identical
  (boot, both panels, info card, every doc/timeline view, dithered photos,
  animated ASCII heroes, 6502 VM, CLI, vim editor, all dialogs, boss key).
- Modularized `App.jsx` into `components/` + `features/` + `dialogs/`; every
  view/dialog is its own file.
- 100% Tailwind conversion.
- ESLint (flat config) + Prettier; lint clean.
- Bug fixes: AudioContext autoplay warnings gone (audio only wakes on a real user
  gesture); block cursor smoothed (rAF-batched `translate3d`); contact form
  guards against double-sends and shows a sending state.
- `npm run deploy` helper (build + `site.zip`).
- Content + feature work: redacted internship + Minecraft plugin entries, CLI ↔
  GUI parity, screensavers, a mobile-friendly responsive layout, a 404 page,
  deep links, SEO metadata, expanded CLI (find/grep/wc/man/head/tail/etc.), a
  more capable vim editor, print-to-resume stylesheet, and animation polish
  (blast furnace, declassification scan, monospace ASCII-box alignment fix).
- **MCW Starz before/after gallery:** `DocView` renders a labeled before/after
  screenshot pair when a doc entry provides `beforeSrc` / `afterSrc`. The MCW
  Starz entry is wired up (`uploads/mcwstarz-before.png`,
  `uploads/mcwstarz-after.png`). **The two image files are currently
  placeholders — replace them with the real Wayback Machine screenshots**
  (before: the 2021 orange "FROM DRILLZ TO SKILLZ" gym site; after: the 2023
  redesign). Egress in the build environment blocks archive.org, so the
  screenshots have to be captured and dropped in manually.

---

## Conventions & constraints

- **Don't change site content or features** unless intended. Protect the exact
  look and the DOS personality.
- Stay **JavaScript**, **fidelity-first**, single-screen (no route fragmentation).
  Keep the ASCII/CSS animations. Keep `content.js` / `animations.js` as code
  (functions/classes can't be JSON).
- **Verification style:** check changes by building and driving the real app
  (screenshots + console-error capture), not just typing. The Chromium binary is
  at `/opt/pw-browsers/` and Playwright is preconfigured.

---

## Roadmap / next steps

- **Readability & organization pass** across `app/src` — clearer naming,
  structure, and comments (careful, incremental edits inside `Engine.js`).
- **Perfect the look, sound, and feel** — visuals, audio, animations, overall
  DOS feel; add features where they fit the personality.
- **Replace the MCW Starz before/after placeholder images** with the real
  Wayback screenshots (see "What's been done").
- Retire the legacy single-file site at the repo root once nothing depends on it.
- If the cursor still feels laggy in `npm run preview`: switch to a solid
  GPU-composited block cursor.
- Optional: give the CLI/vim mail composers the same anti-double-send guard as the
  GUI dialog.
- Floated feature ideas (not yet scoped): an "AI mode" and expanded interactivity.

---

## Quick sanity checklist for a new session

1. `cd app && npm install && npm run build` — should build clean.
2. `npm run lint` — should be clean.
3. `npm run preview` and click around — boot → panels → a project (viz animates)
   → PROGRAMS (6502 runs) → press `O` for CLI (`help`, `tree`) → F6 Contact.
4. Make changes as small commits on `portfolio-updates`.
