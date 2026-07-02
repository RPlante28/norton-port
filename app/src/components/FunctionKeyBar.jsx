// Bottom F1–F10 function-key bar. Each key is a number chip + a cyan label.
function FKey({ n, label, onClick, href, grow, first }) {
  const num = (
    <span className={`text-ink py-[3px] pr-[2px] ${first ? 'pl-1' : 'pl-1.5'}`}>{n}</span>
  );
  const lbl = (
    <span className={`bg-cyan text-dos-blue py-[3px] px-2 ${grow ? 'flex-1' : ''}`}>{label}</span>
  );
  if (href) {
    return (
      <a className="nc-fkey" href={href} target="_blank" rel="noopener">
        {num}
        {lbl}
      </a>
    );
  }
  return (
    <span className={`nc-fkey ${grow ? 'flex-1 cursor-pointer' : ''}`} onClick={onClick}>
      {num}
      {lbl}
    </span>
  );
}

export default function FunctionKeyBar({ v }) {
  const keys = [
    { n: '1', label: 'Help', onClick: v.fHelp },
    { n: '2', label: 'Menu', onClick: v.fMenu },
    { n: '3', label: 'Edit', onClick: v.fEdit },
    { n: '4', label: 'Resume', onClick: v.openResume },
    { n: '5', label: 'Config', onClick: v.fConfig },
    { n: '6', label: 'Contact', onClick: v.openContact },
    { n: '7', label: 'CLI', onClick: v.fCli },
    { n: '8', label: 'GitHub', href: 'https://github.com/RPlante28' },
    { n: '9', label: 'Home', onClick: v.goRoot },
    { n: '10', label: 'Quit', onClick: v.goRoot, grow: true },
  ];
  return (
    <div className="flex flex-none gap-0 text-[12.5px]">
      {keys.map((k, i) => (
        <FKey key={k.n} first={i === 0} {...k} />
      ))}
    </div>
  );
}
