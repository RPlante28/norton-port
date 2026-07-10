# Rohan Plante - Portfolio (ROHAN-DOS / Norton Commander)

My portfolio, styled as a Norton Commander / DOS text-mode desktop: a boot
sequence, a two-pane file browser, a full CLI mode, a vim-style editor, a live
6502 CPU emulator, screensavers, dialogs, and a few easter eggs.

The whole site lives in the **`app/`** folder: a React + Vite + Tailwind app
that compiles to a fully static bundle. There is no server; the only backend is
a one-file PHP script for the contact form.

## Quick start

```bash
cd app
npm install          # first time only
npm run dev          # local dev server at http://localhost:5173
npm run build        # production build into app/dist/
npm run preview      # serve the production build locally
npm run lint         # ESLint
npm run format       # Prettier
npm run deploy       # build + zip dist/ into app/site.zip for cPanel
```

## Deploying (GoDaddy / cPanel)

1. `npm run deploy` produces `app/site.zip` with the contents of `dist/` at its
   root.
2. In cPanel, open File Manager, go to `public_html/`, upload `site.zip`,
   Extract, then delete the zip.

The build uses relative paths (`base: './'`), so it also works from a
subfolder. The contact form needs PHP, so it only sends once deployed;
everything else works fully offline.

## Where things live

| Path | What it is |
|------|-----------|
| `app/src/engine/Engine.js` | All application logic: file browser, CLI commands, vim editor, 6502 VM transport, WebAudio sounds, dialogs, boot. A file map comment at the top shows every section. |
| `app/src/components/` | Shell chrome: menu bar, file panel, command line, function keys, boot screen, editor, CLI screen, screensavers, boss key, image viewer, CRT overlay, print resume. |
| `app/src/features/` | Right-pane views: info card, document view, education, contact splash, text viewer, directory preview, the 6502 VM panel. |
| `app/src/dialogs/` | Modal dialogs: Configuration, About, Contact, Help, dashboards, resume viewer, mail receipt. |
| `app/src/index.css` | Tailwind directives, the DOS palette tokens, and the `.nc-*` component classes. |
| `app/public/content.js` | **All portfolio text and projects.** Edit this to change what the site says. |
| `app/public/animations.js` | **All ASCII animations** (one function per animation). |
| `app/public/cpu6502.js` | The scalar-pipeline 6502 CPU emulator that powers PROGRAMS. |
| `app/public/contact.php` | Contact-form mail backend (`$TO_EMAIL` near the top). |
| `app/public/assets/`, `app/public/uploads/` | Images, the ASCII portrait, and the resume PDF. |

The three `public/*.js` data files are loaded as classic scripts, not modules.
They are copied verbatim into `dist/`, so content stays editable as plain files
even after a build.

## Editing content -> `app/public/content.js`

Every folder and file in the left-hand browser is one object in `content.js`.
The file is heavily commented; the short version:

```js
// A document (a page on the right):
{ name:'WEBDEV .LOG', kind:'file', size:'3 584', date:'08.20.23',
  doc: D({
    title:    'Web Developer, Intern',
    meta:     'SUMMER 2023',
    sub:      'Essex North Shore, Danvers, MA',
    link:     'https://www.essextech.net',  linkLabel:'VISIT >',
    tags:     ['HTML','CSS','JavaScript'],
    bullets:  [ 'First line.', 'Second line.' ],
    imgSrc:   'uploads/photo.png',   // optional image
    viz:      'sheets',              // optional animation (see animations.js)
    vizLabel: 'SHEETS API',
  })
}

// A folder (holds more items):
{ name:'PROJECTS', kind:'dir', size:'SUB-DIR', date:'06.26.26',
  children:[ /* more files/folders */ ] }
```

- Change wording: edit `title`, `sub`, `bullets`, `tags`.
- Add a project: copy a `{ name, doc:D({...}) }` block into the `children` of
  the folder you want it in.
- Change the intro card (name, GPA, AVAILABLE, paragraph): edit the
  `WHOAMI .TXT` entry at the top of `root`.
- Swap an image: put it in `app/public/uploads/` and set
  `imgSrc:'uploads/yourfile.png'`.
- Before/after screenshots: give an entry `beforeSrc` / `afterSrc` (plus
  optional `beforeLabel` / `afterLabel`) and it renders a labeled comparison
  gallery, like the MCW Starz project.

## Editing animations -> `app/public/animations.js`

Each animation is a function `(frame) => "text to draw"`, collected in one
object. Reference one from a project with `viz:'name'`. Tweak one by editing
its drawing code, or add `myname:(f)=>{ return "..."; }` and set
`viz:'myname'` on a project.

## Contact form

`app/public/contact.php` sends mail to `rohanplante@gmail.com` and runs on
GoDaddy PHP out of the box. It is hardened on both ends: the browser trims,
strips control characters, length-caps and validates before sending; the
server re-sanitizes, validates, strips CR/LF to prevent header injection,
rate-limits per IP, and uses a honeypot field to drop bots. All three ways to
send (the Contact dialog, the vim composer, and the CLI mail flow) POST to it.

## Replacing the resume

The Resume button (also F4, the CLI `resume` command, and the contact-dialog
link) opens `uploads/Rohan_Plante_resume.pdf`. Replace that one file, keep the
filename, and everything keeps working. Printing the page (Ctrl+P) produces a
separate clean one-page resume from `PrintResume.jsx`.

## Project notes

See `HANDOFF.md` for the current state of the project, verification steps, and
the roadmap.
