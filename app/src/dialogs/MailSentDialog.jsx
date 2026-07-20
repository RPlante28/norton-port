// Send receipt for the vim-style mail composer (:send in GUI mode). Shows the
// message details while the POST is in flight, then the delivery result.
export default function MailSentDialog({ v }) {
  const m = v.mailSent;
  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[420px] max-w-[94vw] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}
    >
      <div className="bg-dos-blue text-cyan flex items-center px-2 py-[3px] font-bold">
        <span className="flex-1">sendmail</span>
        <span onClick={v.closeDialog} className="nc-close">
          x
        </span>
      </div>
      <div className="px-4 py-3.5">
        <div className="border-2 border-black bg-dos-blue px-3.5 py-3.5 leading-[1.7] font-mono text-[12.5px]">
          <div className="text-cyan font-bold mb-1.5">
            {m.done ? (m.ok ? '✔ MESSAGE DELIVERED' : '✗ SEND FAILED') : 'SENDING …'}
          </div>
          <div className="text-muted whitespace-pre-wrap">{'to      : ' + v.links.email}</div>
          <div className="text-muted whitespace-pre-wrap">{'from    : ' + m.from}</div>
          <div className="text-muted whitespace-pre-wrap">{'subject : ' + m.subject}</div>
          <div className="text-muted whitespace-pre-wrap">{'size    : ' + m.bytes + ' bytes'}</div>
        </div>
        <div className="text-[12.5px] mt-2.5 leading-[1.5]">
          {m.done
            ? m.ok
              ? 'Your note is on its way - Rohan will write back soon.'
              : 'Could not send - please e-mail ' + v.links.email + ' directly.'
            : 'Handing your message to the mail daemon …'}
        </div>
      </div>
      <div className="flex justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px]">
          &nbsp;Ok&nbsp;
        </span>
      </div>
    </div>
  );
}
