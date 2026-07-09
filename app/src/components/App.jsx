import { useRef, useEffect, useSyncExternalStore } from 'react';
import Engine from '../engine/Engine.js';
import BootScreen from './BootScreen.jsx';
import MenuBar from './MenuBar.jsx';
import FilePanel from './FilePanel.jsx';
import RightPane from '../features/RightPane.jsx';
import EditorOverlay from './EditorOverlay.jsx';
import CliFullScreen from './CliFullScreen.jsx';
import CommandLine from './CommandLine.jsx';
import FunctionKeyBar from './FunctionKeyBar.jsx';
import Dialogs from '../dialogs/Dialogs.jsx';
import BossMode from './BossMode.jsx';
import ImageViewer from './ImageViewer.jsx';
import CrtOverlay from './CrtOverlay.jsx';
import Screensaver from './Screensaver.jsx';

// The ROHAN-DOS screen, composed from the shell chrome + feature/dialog
// components. All application logic lives in Engine; React reads the single
// `vals` object it produces and re-renders via useSyncExternalStore.
export default function App() {
  const ref = useRef(null);
  if (!ref.current) ref.current = new Engine({});
  const engine = ref.current;

  useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  useEffect(() => {
    engine.componentDidMount();
    return () => engine.componentWillUnmount();
  }, [engine]);
  useEffect(() => {
    engine.componentDidUpdate();
  });

  const v = engine.renderVals();

  return (
    <div className="h-full flex flex-col gap-1 text-[14px] overflow-hidden pt-[5px] px-2 pb-1">
      {v.booting && <BootScreen v={v} />}

      <MenuBar menus={v.menus} anyMenuOpen={v.anyMenuOpen} closeMenu={v.closeMenu} />

      {/* two panels (side-by-side on desktop, stacked on mobile via .nc-panels) */}
      <div className="nc-panels flex-auto min-h-0 mt-[7px]">
        <FilePanel v={v} />

        <div className="relative flex flex-col min-h-0 border-[3px] border-double border-cyan">
          <div className="absolute -top-[11px] left-0 right-0 text-center pointer-events-none z-[2]">
            <span className="bg-dos-blue px-3 text-white text-[13px]">{v.rightTitle}</span>
          </div>
          <div className="flex-auto min-h-0 overflow-auto">
            <RightPane v={v} />
          </div>
          {v.edInPanel && (
            <div className="absolute inset-0 z-[3] bg-dos-blue flex flex-col">
              <EditorOverlay v={v} />
            </div>
          )}
        </div>
      </div>

      {v.cliMode && <CliFullScreen v={v} />}

      <CommandLine v={v} />
      <FunctionKeyBar v={v} />

      {/* DOS block mouse cursor */}
      <div className="nc-mouse" ref={v.mouseRef}></div>

      <Dialogs v={v} />
      {v.bossMode && <BossMode v={v} />}
      {v.saver && <Screensaver logo={v.bootLogo} mode={v.saverMode} />}
      {v.imgViewOpen && <ImageViewer v={v} />}
      <CrtOverlay crt={v.crt} scanBg={v.crtScanBg} />
    </div>
  );
}
