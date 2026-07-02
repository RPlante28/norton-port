export default function AboutDialog({ v }) {
  return (
    <div
      onClick={v.stop}
      className="bg-[#b8b8b8] text-black w-[440px] text-[13.5px]"
      style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.45)' }}
    >
      <div className="bg-dos-blue text-cyan text-center p-[3px] font-bold">About</div>
      <div className="px-[18px] py-4 leading-[1.6]">
        <div className="font-bold text-[15px] mb-1.5">ROHAN-DOS Portfolio Commander</div>
        <div>Version 5.51 · Computer Science Edition</div>
        <div className="my-2">
          A one-file homage to Norton Commander. Built by Rohan Plante. Navigate with the mouse, the
          arrow keys, or the command line below.
        </div>
        <div className="text-[#06457a]">© MMXXVI · Middleton, MA · thanks for stopping by</div>
      </div>
      <div className="flex justify-center pb-3.5">
        <span onClick={v.closeDialog} className="nc-dlgbtn px-[22px] py-[3px]">
          &nbsp;Ok&nbsp;
        </span>
      </div>
    </div>
  );
}
