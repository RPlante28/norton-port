# ROHAN-DOS, a portfolio that boots

A personal portfolio disguised as a **Norton Commander / MS-DOS text-mode
desktop**. It boots with a BIOS-style POST sequence, drops you into a two-pane
file browser, and lets you explore projects, experience, and education as if
you were digging through an old hard drive from 1989.

**Live site: [rohanplante.com](https://www.rohanplante.com/)**

Built by Rohan Plante, Computer Science @ Marist University.

---

## The systems

It looks like a static novelty page, but almost everything is a working
subsystem. Here is the full tour.

### Boot and shell

- **Boot sequence.** A POST/BIOS screen streams in on load: memory count,
  device detection, and a drive spin-up before the desktop appears.
- **Menu bar and function-key bar.** A period-correct top menu and the classic
  `F1`...`F10` shortcut strip along the bottom, both fully wired.
- **CRT overlay.** An optional scanline and phosphor-glow layer over the whole
  screen for the real cathode-ray look.

### File browser (the GUI)

- **Two-pane layout.** The left pane is a keyboard-driven file browser; the
  right pane renders whatever is selected.
- **Folders and files.** Arrow keys and Enter walk the tree. Folders open into
  sub-directories; files open into typed views.
- **Right-pane views.** Each kind of entry has its own renderer: an intro info
  card, a directory preview, long-form document pages, an education timeline, a
  contact splash, a plain-text viewer, and the 6502 VM panel.
- **Photo galleries and image viewer.** Project pages can carry images,
  click-to-zoom galleries, and labeled before/after comparison pairs.
- **Dithered and halftoned images.** Real photos are rendered in a
  period-correct 1-bit and palette-quantized style (halftone and duotone
  variants included).

### Command line (the CLI)

- **Full-screen shell.** Press `O` to drop into a real terminal. Everything you
  can do in the GUI you can also do here, so the two stay in parity.
- **A deep command set:** `help`, `ls`, `cd`, `tree`, `cat`, `find`, `grep`,
  `wc`, `head`, `tail`, `man`, `pwd`, `history`, `whoami`, `date`, `ver`, `bc`,
  `ps`, `cls`, `copy`, plus toggles for `screensaver`, `sound`, `config`, the
  `resume`, and the `viz` animations.
- **Built-in manual.** `man <command>` prints real usage for most commands.

### 6502 CPU emulator

- **A working, scalar-pipeline MOS 6502.** It executes actual machine code
  rather than faking it, exposed through the PROGRAMS view (`Vm6502`).
- **Adjustable clock.** `6502 speed <n>` retunes the emulator's clock live.

### Editor and mail

- **Vim-style editor.** A modal text editor overlay with the expected motions
  and commands.
- **Mail composer.** The editor doubles as a mail client: compose a message,
  run `:send`, and it delivers through the contact backend, then shows a
  to/from/subject/size send receipt.

### Contact backend

- **Hardened PHP mail script.** The only server-side code in the project. The
  browser trims, strips control characters, length-caps, and validates before
  sending; the server re-sanitizes, strips CR/LF to block header injection,
  rate-limits per IP, and uses a honeypot field to drop bots.
- **Three ways in.** The Contact dialog, the vim composer, and the CLI mail
  flow all POST to the same endpoint.

### Sound, dialogs, and extras

- **WebAudio sound.** Period-appropriate beeps and clicks that only wake on a
  real user gesture (no autoplay warnings).
- **Modal dialogs.** Configuration, About, Contact, Help, dashboards, a resume
  viewer, and the mail receipt.
- **Screensavers.** Several DOS-era screensavers that kick in when idle.
- **A hidden easter-egg hunt.** The desktop has a handful of undocumented
  commands and switches. Flip on hidden files and open `.SECRET.EGG` to start
  the trail — from there, a `secrets` ledger tracks what you have turned up and
  leaves a terse pointer for everything you have not.

### Static-site plumbing

- **Responsive layout.** The whole desktop reflows for mobile and keeps working
  by touch.
- **Deep links, a custom 404 page, a sitemap, and SEO/OpenGraph metadata.**
- **Print-to-resume stylesheet.** `Ctrl+P` produces a separate clean one-page
  resume (`PrintResume.jsx`) instead of printing the DOS screen.
- **Offline-first.** Everything except the contact form works with no server at
  all.

## Tech stack

- **React 18 + Vite + Tailwind CSS**, compiled to a fully static bundle.
- **No framework backend.** The only server-side code is one PHP script for the
  contact form.
- Portfolio text, ASCII animations, and the 6502 emulator live as plain
  `public/*.js` data files, so content stays editable even after a build.

---

## Running it locally

```bash
cd app
npm install          # first time only
npm run dev          # dev server at http://localhost:5173 (hot reload)
npm run build        # production build into app/dist/
npm run preview      # serve the production build locally
npm run lint         # ESLint
npm run format       # Prettier
```

The contact form POSTs to `contact.php`, which needs PHP, so it only sends once
deployed. Everything else (boot, navigation, the 6502 VM, CLI, editor, images,
dialogs) works fully offline in `dev` and `preview`.

## Deploying

The site is a static bundle (`base: './'`, so relative paths work from any
subfolder). Three deploy helpers are included, each of which builds first:

```bash
npm run deploy       # build + upload over FTP/FTPS  (default)
npm run deploy:zip   # build + zip dist/ into app/site.zip (manual cPanel upload)
npm run deploy:ssh   # build + deploy over SSH
```

### FTP deploy (the default)

`npm run deploy` builds and then pushes `dist/` straight to the web host over
FTPS with `scripts/deploy-ftp.mjs`. This is the day-to-day path because GoDaddy
shared hosting ships with SSH turned off but FTP always available. The script:

- walks `dist/`, groups files by folder, and uploads them one by one with a
  live progress bar (files, percent, and bytes transferred);
- creates any missing remote directories as it goes (`ensureDir` per folder);
- defaults to **FTPS** (explicit TLS) and falls back to plain FTP only if you
  ask for it.

Credentials never live in git. The script reads them from **`app/deploy.json`**
(git-ignored) or from environment variables:

```jsonc
// app/deploy.json
{
  "ftp": {
    "host": "rohanplante.com",
    "user": "deploy@rohanplante.com",   // a cPanel FTP account (or the cPanel user)
    "password": "…",
    "path": "public_html",              // target dir ("/" if the account is rooted there)
    "secure": true                      // FTPS; set false for plain FTP
  }
}
```

Environment overrides: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, `FTP_PATH`,
`FTP_SECURE` (`0` for plain FTP). If a TLS handshake fails, set
`"secure": false`.

### Manual (zip) deploy

If you would rather upload by hand, run `npm run deploy:zip`, then in cPanel go
to File Manager, open `public_html/`, upload `site.zip`, Extract, and delete the
zip. The zip contains the *contents* of `dist/` at its root, so files land
directly in `public_html/`.

---

## Project layout

Everything lives in the **`app/`** folder.

| Path | What it is |
|------|-----------|
| `src/engine/Engine.js` | All application logic: file browser, CLI commands, vim editor, 6502 VM transport, WebAudio sounds, dialogs, boot. A section map comment at the top lists every part. |
| `src/components/` | Shell chrome: menu bar, file panel, command line, function keys, boot screen, editor, CLI screen, screensavers, boss key, image viewer, CRT overlay, print resume. |
| `src/features/` | Right-pane views: info card, document view, education, contact splash, text viewer, directory preview, the 6502 VM panel. |
| `src/dialogs/` | Modal dialogs: Configuration, About, Contact, Help, dashboards, resume viewer, mail receipt. |
| `src/index.css` | Tailwind directives, the DOS palette tokens, and the `.nc-*` component classes. |
| `public/content.js` | **All portfolio text and projects.** Edit this to change what the site says. |
| `public/animations.js` | **All ASCII animations** (one function per animation). |
| `public/cpu6502.js` | The scalar-pipeline 6502 CPU emulator that powers PROGRAMS. |
| `public/contact.php` | Contact-form mail backend (`TO_EMAIL` near the top). |
| `public/assets/`, `public/uploads/` | Images, the ASCII portrait, and the resume PDF. |

The three `public/*.js` files are loaded as classic scripts, not modules. They
are copied verbatim into `dist/`, so content stays editable as plain files even
after a build.

## How content is structured

All of the site's text, projects, and images are described in one file,
**`app/public/content.js`**. You never touch `index.html` or any component to
change what the site says. The file is heavily commented and loaded as a
classic script that exposes `window.PORTFOLIO`, which the engine reads.

### The tree

`content.js` exports a single `root` object: the file browser you see on the
left. Every folder and file in that browser is one plain JavaScript object, and
folders nest via a `children` array, so the whole site is just a tree.

There are two node shapes:

```js
// A folder holds more nodes:
{ name:'PROJECTS', kind:'dir', size:'SUB-DIR', date:'06.26.26',
  children:[ /* more files and folders */ ] }

// A file opens into a page on the right:
{ name:'WEBDEV .LOG', kind:'file', size:'3 584', date:'08.20.23',
  doc: D({ /* the page content, see below */ }) }
```

Every node carries the columns the browser renders: `name` (the DOS-style
8.3 filename), `kind` (`dir` or `file`), `size`, and `date`.

### Document pages

A file's `doc` is built with the `D({...})` helper. Its common fields:

| Field | What it does |
|-------|--------------|
| `title` | Big heading on the page. |
| `meta` | Small line under the title (dates / place). |
| `sub` | One-line italic summary. |
| `bullets` | Array of paragraph / bullet strings. |
| `tags` | Array of little pill labels (e.g. `['HTML','CSS']`). |
| `link` / `linkLabel` | A URL for the button and the button's text. |
| `imgSrc` | `'uploads/yourfile.png'` to show an image. |
| `viz` / `vizLabel` | Name of an ASCII animation (see `animations.js`) and its caption. |
| `beforeSrc` / `afterSrc` | A labeled before/after comparison gallery (plus optional `beforeLabel` / `afterLabel`). |

There are also `T(body)` for a plain-text file and `A(body)` for an ASCII-art
node, alongside `D` for a full document.

### Common edits

- **Change wording:** edit `title`, `sub`, `bullets`, `tags` on the entry.
- **Add a project:** copy an existing `{ name, doc:D({...}) }` block and paste
  it into the `children` array of the folder you want it in.
- **Change the intro card** (name, GPA, availability, paragraph): edit the
  `WHOAMI .TXT` entry at the very top of `root`.
- **Swap an image:** drop it in `app/public/uploads/` and set
  `imgSrc:'uploads/yourfile.png'`.

Because `content.js`, `animations.js`, and `cpu6502.js` are copied verbatim
into `dist/`, all of this stays editable as plain files even in a built,
deployed site.

### ASCII animations

Each animation in **`app/public/animations.js`** is a function
`(frame) => "text to draw"`, collected in one object. Reference one from a
project with `viz:'name'`, or add `myname:(f)=>{ return "..."; }` and set
`viz:'myname'`.

> The ASCII animations were, for the most part, generated with the help of
> Claude (Anthropic), then hand-tuned to fit each project and the DOS aesthetic.

### Resume

The Resume button (also `F4`, the CLI `resume` command, and the contact-dialog
link) opens `uploads/Rohan_Plante_resume.pdf`. Replace that one file, keep the
filename, and everything keeps working.

---

## Notes

See [`NOTES.md`](./NOTES.md) for architecture details, conventions, and the
current state of the project.
