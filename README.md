# Rohan Plante — Portfolio (ROHAN-DOS / Norton Commander)

The deployable portfolio site. It's the exact Claude Design product, made
**self-contained** so it drops onto GoDaddy static hosting with no build step
and no third-party CDN. To change it day-to-day you only ever touch **two
files**: `content.js` (what it says) and `animations.js` (the ASCII art).

## Files

| File / folder         | What it is                                                                 |
|-----------------------|----------------------------------------------------------------------------|
| **`content.js`**      | **All text & projects.** Edit this to change what the site says.            |
| **`animations.js`**   | **All ASCII animations.** Edit/add the little moving art here.              |
| `index.html`          | The app shell, layout, and logic. You rarely need to open this.            |
| `support.js`          | Claude Design runtime that renders the app. **Don't edit.**                 |
| `cpu6502.js`          | The 6502 CPU emulator used by the `CPU6502.TS` project demo.               |
| `contact.php`         | Contact-form backend — actually e-mails you (see "Contact form" below).     |
| `vendor/react*.js`    | React 18.3.1 + ReactDOM, vendored locally so the page needs no CDN.         |
| `assets/`, `uploads/` | Images, logos, ASCII portrait, and the résumé PDF.                          |

## Deploying to GoDaddy

1. GoDaddy → **cPanel → File Manager** (or FTP).
2. Upload **everything in this folder** into `public_html/`.
3. Visit your domain. No build, no Node, no npm.

> The page loads the **Space Mono** webfont from Google Fonts (exactly like the
> original design). Everything else is served from your own host.

## Editing CONTENT  → `content.js`

Every folder and file you see in the left-hand browser is one object in
`content.js`. The file is heavily commented; the short version:

```js
// A document (a page on the right):
{ name:'WEBDEV .LOG', kind:'file', size:'3 584', date:'08.20.23',
  doc: D({
    title:    'Web Developer · Intern',
    meta:     'SUMMER 2023',
    sub:      'Essex North Shore · Danvers, MA',
    link:     'https://www.essextech.net',  linkLabel:'VISIT ▸',
    tags:     ['HTML','CSS','JavaScript'],
    bullets:  [ 'First line.', 'Second line.' ],
    imgSrc:   'uploads/photo.png',   // optional image
    viz:      'sheets',              // optional animation (see animations.js)
    vizLabel: 'SHEETS API → MAPS',
  })
}

// A folder (holds more items):
{ name:'PROJECTS', kind:'dir', size:'▶SUB-DIR◄', date:'06.26.26',
  children:[ /* more files/folders */ ] }
```

- **Change wording** → edit `title`, `sub`, `bullets`, `tags`.
- **Add a project** → copy a `{ name:…, doc:D({…}) }` block into the
  `children:[ ]` of the folder you want it in.
- **Change the intro card** (name, GPA, "AVAILABLE", paragraph) → edit the
  `WHOAMI .TXT` entry at the very top of `root`.
- **Swap an image** → put it in `uploads/` and set `imgSrc:'uploads/yourfile.png'`.

## Editing ANIMATIONS → `animations.js`

Each animation is a function `(frame) => "text to draw"`, collected in one
object. Reference one from a project with `viz:'name'`. Built-in names:

```
radar  pipe  pantry  route  boot  web  dash  sheets  forge
court  mc    wave    hud    ascent ridge steam
```

- **Tweak one** → find it by name and edit its drawing code.
- **Add one** → add `myname:(f)=>{ return "..."; },` then set `viz:'myname'`
  on a project in `content.js`.

## Contact form

`contact.php` is wired up and **actually sends e-mail** to
`rohanplante@gmail.com`. It runs on GoDaddy's PHP out of the box.

It is hardened on **both** ends:

- **In the browser** (`index.html`): inputs are trimmed, stripped of control
  characters, length-capped, and validated (name + valid e-mail + message)
  before anything is sent. Empty/invalid input shows an inline error.
- **On the server** (`contact.php`): re-sanitizes everything, validates the
  e-mail, strips CR/LF to prevent mail-header injection, rate-limits to 5
  messages per IP per hour, and uses a hidden honeypot field to drop bots.

All three ways to reach the form — the **Contact** dialog, the in-app
`SENDMAIL`/`mail` composer, and the CLI `mail` flow — POST to `contact.php`.

To change the destination address, edit `TO_EMAIL` near the top of
`contact.php`.

## Replacing the résumé

The **Resume** button (and the F4 key, the CLI `resume` command, and the
contact-dialog link) all open `uploads/Rohan_Plante_resume.pdf` in a popup
window. To update it, just replace that one file with your new PDF — keep the
same filename and everything keeps working.
