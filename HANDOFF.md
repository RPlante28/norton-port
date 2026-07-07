# ROHAN-DOS Portfolio — Handoff

A working handoff for continuing this project in a new conversation. Paste or
attach this file to give the next session full context.

---

## TL;DR — current state

- **What it is:** Rohan Plante's portfolio, styled as a Norton Commander / DOS
  text-mode desktop (boot screen, two-pane file browser, CLI mode, a live 6502
  CPU emulator, dithered photos, dialogs, easter eggs).
- **What just happened:** the site was rebuilt from a single self-contained HTML
  file onto a modern **React + Vite + Tailwind** toolchain, then fully modularized
  and converted to Tailwind. It reproduces the original **pixel-for-pixel**.
- **Where it lives:** GitHub repo **`RPlante28/norton-port`**, branch
  **`react-vite-tailwind-rebuild`**, all under the **`app/`** folder.
- **Not yet merged** into `main`. `main` still holds the older single-file site at
  the repo root. The rebuild is self-contained in `app/` and touches nothing else.
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
a `vals` object) from **view** (a template that consumed `vals`). The rebuild
preserves that seam.

### Directory map (`app/`)

| Path | What it is |
|------|-----------|
| `index.html` | Loads the 3 data scripts as classic `<script>`s, then the React entry. |
| `src/main.jsx` | Mounts `<App/>` (no StrictMode — the engine has real timers/audio). |
| `src/components/App.jsx` | ~74-line composition of the shell + feature/dialog components. |
| `src/components/` | Shell chrome: `MenuBar`, `FilePanel`, `CommandLine`, `FunctionKeyBar`, `BootScreen`, `EditorOverlay`, `CliFullScreen`, `BossMode`, `ImageViewer`, `CrtOverlay`. |
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

1. **Engine is a verbatim port.** `Engine.js` is the original single-file logic
   class, unchanged except a small store shim at the top that replaces the old
   runtime base class: `subscribe` / `getSnapshot` / `setState` (synchronous
   merge + emit) / `forceUpdate` / `_emit`. React drives it via
   `useSyncExternalStore` + effects calling `componentDidMount` /
   `componentDidUpdate` / `componentWillUnmount`. **Prefer surgical edits here;
   don't reshape it.** (ESLint is relaxed for this file on purpose.)

2. **`renderVals()` is the bridge.** It returns one `vals` object; every React
   component just reads `v.*` from it. Handlers, refs, computed strings, list
   data — all come from `renderVals`. To add UI state, add a field there.

3. **Data files are classic scripts, not modules.** `content.js`,
   `animations.js`, `cpu6502.js` live in `public/`, are loaded via `<script>` in
   `index.html`, and expose `window.PORTFOLIO` / `window.VIZ` / `window.CPU6502`.
   This keeps the "edit one plain file to change content" workflow and copies them
   verbatim into `dist/` (still editable after a build). Engine reads the globals.

4. **Styling is Tailwind.** The DOS palette is Tailwind theme tokens
   (`text-cyan`, `bg-dos-blue`, `border-edge-dim`, `text-yellow`, `text-muted`,
   `text-dim`, …) mirrored in CSS `:root`. Repeated chrome lives in `.nc-*`
   classes in `index.css` (`.nc-btn`, `.nc-tag`, `.nc-frow`, `.nc-vbtn`,
   `.nc-dlgbtn`, `.nc-close`, `.nc-progress`, etc.). Only genuinely complex
   one-offs (filters, keyframe shorthands, multi-part box-shadows, gradients)
   remain as small inline `style={{…}}` objects — idiomatic, not a TODO. There is
   **no `s()` helper anymore** (it was deleted after full conversion).

---

## What's been done (this rebuild)

- Faithful React/Vite/Tailwind port of the entire app; verified pixel-identical
  (boot, both panels, info card, every doc/timeline view, dithered photos,
  animated ASCII heroes, 6502 VM, CLI, vim editor, all dialogs, boss key).
- Modularized `App.jsx` (~730 → 74 lines) into `components/` + `features/` +
  `dialogs/`; every view/dialog is its own file.
- 100% Tailwind conversion; `s()` helper removed.
- ESLint (flat config) + Prettier; lint clean.
- Bug fixes:
  - **AudioContext autoplay warnings** — gone; audio only wakes on a real user
    gesture (dropped the on-load resume; `_bootClick` is a no-op until unlocked).
  - **Cursor lag** — the custom DOS block cursor (`mix-blend-mode: difference`)
    is now rAF-batched with `translate3d`; the ASCII animation loop recomputes
    ~14×/sec instead of 60×/sec to free the main thread. If it still drags in a
    production build, the agreed fallback is a **solid GPU-composited block**
    (drops only the invert-under-it effect) — not yet applied.
  - **Contact form double-send** — `sendContact()` guards against re-entry while a
    send is in flight, tracks a `sending` state, and swaps Send/Cancel for a
    DOS-striped indeterminate progress bar + "no need to click again". Verified:
    6 rapid clicks → exactly 1 POST.
- `npm run deploy` helper (build + `site.zip`).

---

## Conventions & constraints

- **Don't change site content or features** unless asked. The user is protective
  of the exact look and the DOS personality.
- Earlier the user pasted an aspirational "V2" spec (TypeScript, feature folders,
  Framer Motion, React Router, Lucide, JSON data). Agreed reconciliation:
  **stay JavaScript**, **fidelity-first**, keep it a **single-screen** app (no
  route-fragmentation — Router only ever for a 404 if added), keep the ASCII/CSS
  animations (no Framer Motion rewrite), and keep `content.js`/`animations.js` as
  code (functions/classes can't be JSON). Adopt the *good* parts (modular
  structure, Tailwind, ESLint/Prettier) — which is done.
- **Verification style:** changes are checked by building and driving the real app
  headless with Playwright (screenshots + console-error capture), not just typing.
  A fresh container won't have the ad-hoc scripts that were in a scratchpad; the
  Chromium binary is at `/opt/pw-browsers/` and Playwright is preconfigured.
- **Git push:** this environment's git proxy 403s this private repo, so pushes are
  done to a tokenized `https://<token>@github.com/RPlante28/norton-port.git` URL
  (direct egress to github.com works). The push token is **not** stored in the
  repo or this file. Commits are incremental (no force-push). The branch is
  rebased on top of current `main` so a PR shows just the `app/` addition.

---

## Possible next steps (not started)

- Open a PR from `react-vite-tailwind-rebuild` into `main` (user hasn't decided).
- If the cursor still feels laggy in `npm run preview`: switch to the solid
  GPU-composited block cursor.
- Optional: give the CLI/vim mail composers the same anti-double-send guard as the
  GUI dialog (the GUI one is fixed; CLI submits once on Enter, lower risk).
- Optional future features the user has floated: an "AI mode" and expanded
  interactivity — none scoped yet.

---

## Quick sanity checklist for a new session

1. `cd app && npm install && npm run build` — should build clean.
2. `npm run lint` — should be clean.
3. `npm run preview` and click around — boot → panels → a project (viz animates)
   → PROGRAMS (6502 runs) → press `O` for CLI (`help`, `tree`) → F6 Contact.
4. Make changes as small commits; push to `react-vite-tailwind-rebuild`.
