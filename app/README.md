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
| `src/components/App.jsx` | The whole DOS screen (faithful JSX port of the original template). |
| `src/engine/Engine.js` | All app logic — file browser, CLI, editor, 6502 VM, audio, dialogs. Ported verbatim from the original; the only change is a small subscribe/`setState`/`forceUpdate` store that replaces the old runtime base class. React drives it via `useSyncExternalStore` + effects. |
| `src/util/style.js` | `s("css:string")` → React style object, used to carry the DOS inline styles over 1:1. |
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

## Status: fidelity-first pass

This pass reproduces the original **exactly** (verified: boot, both panels, the
info card, every doc/timeline view, dithered photos, the animated ASCII heroes,
the 6502 VM, and full CLI mode — building to a static `dist/` with no runtime
errors). Inline styles were carried over via `s()` to guarantee the look.

**Next pass** (per the agreed plan): progressively convert the high-traffic
inline styles to Tailwind classes, split `App.jsx` into `components/` + `features/`,
and add ESLint/Prettier — without changing any behaviour or content.
