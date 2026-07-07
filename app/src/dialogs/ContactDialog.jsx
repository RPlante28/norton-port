// Contact form dialog (posts to contact.php via the engine) plus social links.
export default function ContactDialog({ v }) {
  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[480px] max-w-[94vw] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}
    >
      <div className="bg-dos-blue text-cyan flex items-center px-2 py-[3px] font-bold">
        <span className="flex-1">Send a Message</span>
        <span onClick={v.closeDialog} className="nc-close">
          x
        </span>
      </div>
      <div className="px-4 py-3.5">
        {v.sent && (
          <div className="border-2 border-black bg-dos-blue text-cyan px-3.5 py-[18px] text-center leading-[1.6]">
            <div className="text-[15px] font-bold">✔ Message queued</div>
            <div className="text-[12.5px] text-muted">
              C:\ROHAN&gt; sendmail - your note has been written to the outbox. Rohan will write back soon.
            </div>
          </div>
        )}
        {v.notSent && (
          <>
            <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-[9px] items-center">
              <label className="text-[13px]">Name</label>
              <input type="text" className="nc-field" ref={v.cNameRef} placeholder="Your name" />
              <label className="text-[13px]">E-mail</label>
              <input type="text" className="nc-field" ref={v.cEmailRef} placeholder="you@domain.com" />
              <label className="text-[13px] self-start pt-1">Message</label>
              <textarea rows="4" className="nc-field resize-none" ref={v.cMsgRef} placeholder="Say hello …"></textarea>
            </div>
            {v.hasContactErr && <div className="text-[#a80000] text-[12px] mt-2">{v.contactErr}</div>}
            {v.sending ? (
              <div className="mt-3.5">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-[12px] text-dos-blue font-bold">Sending…</span>
                  <span className="flex-1"></span>
                  <span className="text-[11px] text-[#555]">please wait, no need to click again</span>
                </div>
                <div className="nc-progress">
                  <i />
                </div>
              </div>
            ) : (
              <div className="flex gap-3 justify-end mt-3.5">
                <span onClick={v.sendContact} className="nc-dlgbtn px-5 py-1 font-bold">
                  Send
                </span>
                <span onClick={v.closeDialog} className="nc-dlgbtn px-4 py-1">
                  Cancel
                </span>
              </div>
            )}
          </>
        )}
        <div className="border-t-2 border-[#8a8a8a] mt-3.5 pt-3">
          <div className="text-[11px] text-[#444] tracking-[0.08em] mb-2">OR FIND ME ON ───</div>
          <div className="flex gap-2.5 flex-wrap">
            {v.socials.map((soc, i) => (
              <a
                key={i}
                className="nc-social no-underline text-dos-blue flex items-center gap-2 border-2 border-black bg-dos-blue pl-1 pr-2.5 py-1"
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ boxShadow: '2px 2px 0 #5a5a5a' }}
              >
                <span className="w-[26px] h-[26px] flex-none flex items-center justify-center bg-cyan text-dos-blue border border-black text-[15px] font-bold">
                  {soc.glyph}
                </span>
                <span className="flex flex-col leading-[1.15]">
                  <span className="text-white text-[12.5px] font-bold">{soc.label}</span>
                  <span className="text-muted text-[10.5px]">{soc.handle}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
