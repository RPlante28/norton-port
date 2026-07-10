# ROHAN-DOS Portfolio, Project Notes

Working notes for continuing this project. Covers what it is, how to run and
deploy it, how the code is organized, what's done, and what's next.

> **Status:** refinement pass complete (July 2026). The legacy single-file site
> at the repo root is retired; `app/` is the only site. Bug fixes: the `copy`
> clipboard command, a proper send-receipt dialog for the vim mail composer,
> and the composer's Subject parsing. The MCW Starz entry's before/after
> gallery uses real Wayback Machine captures; to refresh either shot, just
> overwrite `app/public/uploads/mcwstarz-before.png` / `mcwstarz-after.png`
> (no code change needed).

---

## TL;DR — current state

- **What it is:** my portfolio, styled as a Norton Commander / DOS text-mode
  desktop (boot screen, two-pane file browser, CLI mode, a live 6502 CPU
  emulator, dithered photos, dialogs, easter eggs).
- **Stack:** the live app is **React + Vite + Tailwind**, fully modularized, all
  under the **`app/`** folder. It reproduces the original single-file design
  pixel-for-pixel and has had content + animation work layered on top.
- **Where it lives:** GitHub repo **`RPlante28/norton-port`**. Day-to-day work
  goes on a feature branch (currently **`portfolio-refinements`**) and merges
  into **`main`** once verified.
- The old single-file site that used to sit at the repo root was **removed**
  (July 2026): `app/public/` carried identical or newer copies of every asset,
  so nothing referenced it. The repo root now holds only `app/`, `README.md`,
  and this file.
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
  screenshot pair when a doc entry provides `beforeSrc` / `afterSrc` (plus
  optional labels). The MCW Starz entry is wired up with the real Wayback
  Machine captures in `uploads/mcwstarz-before.png` / `mcwstarz-after.png`,
  labeled "BEFORE / AFTER, VIA WAYBACK MACHINE" with click-to-zoom into the
  gallery viewer. Verified rendering in the built app.
- **Refinement pass (July 2026):**
  - Fixed `copy <email|github|linkedin|resume>` (was shadowed by the `cp`
    alias and always printed a usage error).
  - Added the missing send-receipt dialog for the vim mail composer in GUI
    mode (`:send` used to leave an empty dimmed backdrop); it shows
    to/from/subject/size and the delivery result.
  - Fixed the composer header parser so an empty `Subject:` line no longer
    swallows the template's separator dashes as the subject.
  - `cls` now clears the terminal like DOS (it used to jump home); user files
    stamp real created/saved dates instead of a hardcoded one; `6502 speed`
    ignores non-numeric input instead of resetting the clock.
  - Removed dead code from retired features (arcade-game lifecycle, tagline
    typewriter, several unreachable duplicate command branches).
  - Expanded `man` coverage (pwd, history, whoami, date, ver, bc, ps,
    screensaver, sound, config, resume, viz) and added a section map comment
    at the top of `Engine.js`.
  - Retired the legacy root site and rewrote `README.md` for the `app/` build.
  - Compressed the MCW Starz before/after PNGs from 2.6 MB / 3.9 MB to
    344 KB / 573 KB (resized to 1600px, palette-quantized; verified crisp).

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

- **Perfect the look, sound, and feel**: visuals, audio, animations, overall
  DOS feel; add features where they fit the personality.
- Floated feature ideas (not yet scoped): an "AI mode" and expanded interactivity.

Done and removed from this list: the readability/organization pass, the real
MCW Starz screenshots, retiring the legacy root site, the cursor feel, and the
double-send guard (cursor and double-send confirmed fine as-is).

---

## Quick sanity checklist for a new session

1. `cd app && npm install && npm run build` — should build clean.
2. `npm run lint` — should be clean.
3. `npm run preview` and click around — boot → panels → a project (viz animates)
   → PROGRAMS (6502 runs) → press `O` for CLI (`help`, `tree`) → F6 Contact.
4. Make changes as small commits on a feature branch (currently
   `portfolio-refinements`); merge to `main` after verifying.
