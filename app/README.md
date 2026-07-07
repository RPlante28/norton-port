# ROHAN-DOS — React + Vite + Tailwind rebuild

A modern-toolchain rebuild of the portfolio. Same app, same DOS/Norton-Commander
look and every feature — now built with **React + Vite + Tailwind** and deployed
as a plain static site.

## Run it

```bash
cd app
npm install
npm run dev      # local dev server (http://localhost:5173)
npm run build    # production build -> app/dist/
npm run preview  # preview the production build
```

## Deploy to GoDaddy (cPanel)

1. `npm run build`
2. Upload **the contents of `app/dist/`** into `public_html/` (File Manager or FTP).
3. Done — no Node/npm on the server.

`contact.php` is copied into `dist/` and runs on GoDaddy's PHP exactly as before,
so the contact form keeps working same-origin (no CORS, no backend to host).
`vite.config.js` sets `base: './'`, so the build also works from a subfolder.

## How it's structured

| Path | What it is |
|------|-----------|
| `index.html` | Loads the data scripts + the React entry. |
| `src/main.jsx` | Mounts `<App/>`. |
| `src/components/App.jsx` | ~75-line composition of the shell + feature/dialog components. |
| `src/components/` | Shell chrome: `MenuBar`, `FilePanel`, `CommandLine`, `FunctionKeyBar`, `BootScreen`, `EditorOverlay`, `CliFullScreen`, `BossMode`, `ImageViewer`, `CrtOverlay`. |
| `src/features/` | Right-pane content views: `RightPane` (switch) + `InfoCard`, `DirPreview`, `DocView`, `EduView`, `ContactView`, `TextView`, `Vm6502`. |
| `src/dialogs/` | Modal layer: `Dialogs` (switch) + `Config`, `About`, `Contact`, `Help`, `Dash`, `Resume`. |
| `src/engine/Engine.js` | All app logic — file browser, CLI, editor, 6502 VM, audio, dialogs. Ported verbatim from the original; the only change is a small subscribe/`setState`/`forceUpdate` store that replaces the old runtime base class. React drives it via `useSyncExternalStore` + effects. |
| `src/index.css` | Tailwind directives + the DOS design tokens (`:root`) + the `.nc-*` component classes and scrollbars/keyframes. |
| `public/content.js` | **All portfolio text & projects.** Edit this to change what the site says. |
| `public/animations.js` | **All ASCII animations.** |
| `public/cpu6502.js` | The 6502 CPU emulator (loaded by the PROGRAMS demo). |
| `public/contact.php` | Contact-form backend (unchanged). |
| `public/assets/`, `public/uploads/` | Images, ASCII portrait, résumé PDF. |

The three data files (`content.js`, `animations.js`, `cpu6502.js`) are loaded as
classic scripts and expose `window.PORTFOLIO` / `window.VIZ` / `window.CPU6502`,
so the "edit one file to change the content" workflow is exactly as it was, and
they're copied verbatim into `dist/` (still editable after a build).

## Status

Reproduces the original **exactly** (verified: boot, both panels, the info card,
every doc/timeline view, dithered photos, the animated ASCII heroes, the 6502 VM,
CLI mode, the editor, and the config/contact dialogs — building to a static
`dist/` with no runtime errors).

Done:

- Modularized: `App.jsx` is a small composition; every view/dialog is its own
  file under `components/`, `features/`, `dialogs/`.
- **Fully Tailwind**: every component is written in Tailwind utility classes with
  the DOS palette as theme tokens (`text-cyan`, `border-edge-dim`, …). The few
  genuinely complex one-offs (filters, keyframe shorthands, multi-part shadows,
  gradients) stay as small inline `style` objects, which is the idiomatic norm.
  Repeated chrome lives in `.nc-*` component classes in `index.css`.
- **ESLint** (`npm run lint`) and **Prettier** (`npm run format`) configured; lint
  is clean.
