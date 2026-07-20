// Full-screen POST/boot splash with the teletype text (engine-driven).
export default function BootScreen({ v }) {
  return (
    <div
      onClick={v.skipBoot}
      className="fixed inset-0 z-[100] bg-black text-[#c8c8c8] font-mono text-[14px] leading-[1.45] px-[30px] py-6 cursor-pointer"
    >
      <div className="flex justify-between text-[#e8e8e8]">
        <span>{v.build.org}, Inc. - {v.build.os} {v.build.version}</span>
        <span>Energy Star Ally ✦</span>
      </div>
      <pre className="mt-3.5 mb-1.5 text-cyan text-[12px] leading-[1.05]">{v.bootLogo}</pre>
      <div className="whitespace-pre-wrap text-[#c8c8c8] mt-2.5">
        {v.bootText}
        <span
          className="inline-block w-2 h-[15px] bg-[#c8c8c8] align-[-3px]"
          style={{ animation: 'ncblink 0.85s steps(1) infinite' }}
        ></span>
      </div>
      <div className="absolute left-0 right-0 bottom-[18px] text-center text-[#6a6a6a] text-[12px]">
        press any key or click anywhere to skip
      </div>
    </div>
  );
}
