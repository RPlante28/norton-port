// SENDMAIL.EXE splash: ASCII hello, blurb, and a RUN button that opens the form.
export default function ContactView({ v }) {
  return (
    <div className="p-[18px] text-center">
      <pre className="inline-block text-left mb-3.5 text-cyan text-[13px] leading-[1.2]">{v.helloArt}</pre>
      <div className="text-[12px] text-yellow mb-1.5">SENDMAIL.EXE - executable</div>
      <div className="text-[13.5px] leading-[1.6] max-w-[46ch] mx-auto mb-4">
        I'm looking for internships and good problems to work on. E-mail is fastest, and I always write back.
      </div>
      <div className="flex flex-wrap gap-2.5 justify-center">
        <span className="nc-btn cursor-pointer" onClick={v.openContact}>
          ▶ RUN - Compose Email
        </span>
      </div>
      <div className="text-[11px] text-[#8fb0e8] mt-[18px]">// press RUN, or type  mail  - middleton, ma · MMXXVI</div>
    </div>
  );
}
