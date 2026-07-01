// s() — parse a CSS declaration string into a React style object, cached.
//
// The DOS chrome was authored as hundreds of precise inline styles. Rather than
// hand-translate every one (and risk visual drift), we carry them over verbatim
// and let this helper convert `"padding:16px; color:#fff"` into the object React
// wants. A follow-up pass converts the high-traffic ones to Tailwind classes.
//
// Safe because none of the ported inline styles contain a ';' inside a value
// (gradients/box-shadows use commas; the only url("data:...;...") lives in
// index.css, not inline).
const _cache = new Map();

export function s(str) {
  if (!str) return undefined;
  const hit = _cache.get(str);
  if (hit) return hit;
  const out = {};
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    let key = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!key) continue;
    // kebab-case -> camelCase (leave --custom-props alone)
    if (key[0] !== '-') key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = val;
  }
  _cache.set(str, out);
  return out;
}

// merge a parsed style string with a few dynamic overrides
export function sx(str, extra) {
  return { ...s(str), ...extra };
}
