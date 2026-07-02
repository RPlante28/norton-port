import { s } from '../util/style.js';
import ConfigDialog from './ConfigDialog.jsx';
import AboutDialog from './AboutDialog.jsx';
import ContactDialog from './ContactDialog.jsx';
import HelpDialog from './HelpDialog.jsx';
import DashDialog from './DashDialog.jsx';
import ResumeDialog from './ResumeDialog.jsx';

// The modal layer: a dimming backdrop (click to close) with exactly one dialog.
export default function Dialogs({ v }) {
  if (!v.dialog) return null;
  return (
    <div onClick={v.closeDialog} style={s("position:fixed; inset:0; z-index:80; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;")}>
      {v.isConfig && <ConfigDialog v={v} />}
      {v.isAbout && <AboutDialog v={v} />}
      {v.isContactDlg && <ContactDialog v={v} />}
      {v.isHelp && <HelpDialog v={v} />}
      {v.isDash && <DashDialog v={v} />}
      {v.isResume && <ResumeDialog v={v} />}
    </div>
  );
}
