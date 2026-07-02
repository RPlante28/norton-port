// Plain text / ASCII-art viewer for user files and read-only program text.
export default function TextView({ v }) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="text-[12px] text-yellow">{v.rightTitle}</span>
        <span className="flex-1"></span>
        {v.textEditable && (
          <span className="nc-vbtn" onClick={v.editSelected}>
            edit (e)
          </span>
        )}
        {v.textReadonly && <span className="text-[11px] text-dim">read-only</span>}
      </div>
      <pre className="m-0 whitespace-pre overflow-auto text-ink text-[13px] leading-[1.32]">{v.textBody}</pre>
    </div>
  );
}
