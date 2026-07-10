import ConfigDialog from './ConfigDialog.jsx';
import AboutDialog from './AboutDialog.jsx';
import ContactDialog from './ContactDialog.jsx';
import HelpDialog from './HelpDialog.jsx';
import DashDialog from './DashDialog.jsx';
import ResumeDialog from './ResumeDialog.jsx';
import MailSentDialog from './MailSentDialog.jsx';

// The modal layer: a dimming backdrop (click to close) with exactly one dialog.
export default function Dialogs({ v }) {
  if (!v.dialog) return null;
  return (
    <div
      onClick={v.closeDialog}
      className="fixed inset-0 z-[80] bg-black/35 flex items-center justify-center"
    >
      {v.isConfig && <ConfigDialog v={v} />}
      {v.isAbout && <AboutDialog v={v} />}
      {v.isContactDlg && <ContactDialog v={v} />}
      {v.isHelp && <HelpDialog v={v} />}
      {v.isDash && <DashDialog v={v} />}
      {v.isResume && <ResumeDialog v={v} />}
      {v.isMailSent && <MailSentDialog v={v} />}
    </div>
  );
}
