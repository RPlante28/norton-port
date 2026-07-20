// A clean, print-only resume (Ctrl/Cmd+P or "Save as PDF"). Hidden on screen;
// see the @media print rules in index.css.
//
// It is GENERATED from the same content as the rest of the site
// (content.js -> window.PORTFOLIO), so it can never drift: edit the portfolio
// and the printed resume updates with it.

const P = (typeof window !== 'undefined' && window.PORTFOLIO) || {};
const root = P.root || { children: [] };
const prof = P.profile || {};
const edu = P.edu || {};
const L = prof.links || {};

const bareUrl = (u, fb) => (u || fb || '').replace(/^https?:\/\//, '').replace(/^mailto:/, '');
// Drop redaction markup ([[n]]) and tidy up leftover separators.
const clean = (s) =>
  (s || '')
    .replace(/\[\[[^\]]*\]\]/g, '')
    .replace(/DATE EARNED:\s*/gi, '')
    .replace(/·\s*FOR ESSEX TECH/gi, '')
    .replace(/·\s*,/g, '·')
    .replace(/,\s*(·|$)/g, ' $1')
    .replace(/·\s*·/g, '·')
    .replace(/\s{2,}/g, ' ')
    .replace(/[·,\s]+$/g, '')
    .trim();

const findDir = (node, name) => {
  for (const c of node.children || []) {
    if (c.kind === 'dir' && c.name.replace(/\s+/g, '') === name) return c;
    if (c.children) {
      const f = findDir(c, name);
      if (f) return f;
    }
  }
  return null;
};
const leaves = (node) => {
  const out = [];
  for (const c of (node && node.children) || []) {
    if (c.kind === 'file' && c.doc) out.push(c);
    else if (c.children) out.push(...leaves(c));
  }
  return out;
};
const fields = (n) => {
  const d = n.doc || {};
  return {
    title: d.title || n.name,
    meta: clean(d.meta),
    sub: clean(d.sub),
    tags: (d.tags || []).filter((t) => !/\[\[/.test(t)),
    bullets: d.bullets || [],
  };
};

// ---- pull the real content ----
const experience = leaves(findDir(root, 'EMPLOYMENT')).map(fields);
const projects = leaves(findDir(root, 'PROJECTS'))
  .filter((n) => n.name.replace(/\s+/g, '') !== 'EAGLE.PRJ') // Eagle lives under Leadership
  .map(fields);
const activities = leaves(findDir(root, 'EXTRACURRICULARS')).map(fields);
const awards = leaves(findDir(root, 'AWARDS')).map(fields);
const skillGroups = ((findDir(root, 'SKILLS') || {}).children || []).map(fields);
const essex = (leaves(findDir(root, 'EDUCATION')) || []).map(fields).find((e) => /Essex/i.test(e.title));

const summary = (() => {
  const status = (prof.availability && prof.availability.status) || 'open';
  const body = (prof.blurb || []).map((s) => (typeof s === 'string' ? s : s.text)).join('');
  const closer = (prof.closer && prof.closer[status]) || '';
  return clean(body + closer);
})();

export default function PrintResume() {
  return (
    <div className="print-resume" aria-hidden="true">
      <header className="pr-head">
        <h1>{prof.name || 'ROHAN PLANTE'}</h1>
        <div className="pr-title">{prof.title ? prof.title.replace(/\s{2,}/g, ' ') : 'Computer Science · Marist University'}</div>
        <div className="pr-contact">
          {L.email || 'rohanplante@gmail.com'} &nbsp;·&nbsp; {bareUrl(L.github, 'github.com/RPlante28')} &nbsp;·&nbsp;
          {bareUrl(L.linkedin, 'linkedin.com/in/rohan-plante')} &nbsp;·&nbsp; Middleton, MA
        </div>
      </header>

      {summary && <p className="pr-summary">{summary}</p>}

      <section>
        <h2>Education</h2>
        <div className="pr-row">
          <div className="pr-l">
            <b>{edu.school || 'Marist University'}</b>
            {edu.degree ? ` — ${edu.degree}` : ''}
            <div className="pr-note">
              GPA {edu.gpa || '3.67 / 4.0'} · Dean&apos;s List, all semesters
            </div>
            {edu.coursework && edu.coursework.length > 0 && (
              <div className="pr-note">Coursework: {edu.coursework.join(', ')}.</div>
            )}
          </div>
          <div className="pr-r">
            {edu.dates || '2024 – Present'} · {edu.location || 'Poughkeepsie, NY'}
          </div>
        </div>
        {essex && (
          <div className="pr-row">
            <div className="pr-l">
              <b>{essex.title}</b>
              {essex.sub && <div className="pr-note">{essex.sub}</div>}
              {essex.tags.length > 0 && <div className="pr-note">{essex.tags.join(' · ')}</div>}
            </div>
            <div className="pr-r">{essex.meta}</div>
          </div>
        )}
      </section>

      <section>
        <h2>Experience</h2>
        {experience.map((e, i) => (
          <div className="pr-row" key={i}>
            <div className="pr-l">
              <b>{e.title}</b>
              {e.sub && <div className="pr-note">{e.sub}</div>}
              {e.bullets[0] && <div className="pr-note">{e.bullets[0]}</div>}
            </div>
            <div className="pr-r">{e.meta}</div>
          </div>
        ))}
      </section>

      <section>
        <h2>Projects</h2>
        <ul className="pr-list">
          {projects.map((p, i) => (
            <li key={i}>
              <b>{p.title}</b>
              {p.sub ? ` — ${p.sub}` : ''}
              {p.tags.length > 0 && <span className="pr-tags"> {p.tags.join(', ')}.</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Leadership &amp; Activities</h2>
        <ul className="pr-list">
          {activities.map((a, i) => (
            <li key={i}>
              <b>{a.title}</b>
              {a.meta ? ` (${a.meta})` : ''}
              {a.bullets[0] ? ` — ${a.bullets[0]}` : a.sub ? ` — ${a.sub}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Skills</h2>
        <div className="pr-skills">
          {skillGroups.map((s, i) => (
            <div key={i}>
              <b>{s.title}:</b> {s.tags.join(', ')}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Awards</h2>
        <ul className="pr-list">
          {awards.map((a, i) => (
            <li key={i}>
              <b>{a.title}</b>
              {a.meta ? ` (${a.meta})` : ''}
              {a.sub ? ` — ${a.sub}` : ''}
              {a.bullets[0] ? ` ${a.bullets[0]}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <div className="pr-foot">Full interactive portfolio at www.rohanplante.com</div>
    </div>
  );
}
