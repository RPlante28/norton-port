import InfoCard from './InfoCard.jsx';
import DirPreview from './DirPreview.jsx';
import DocView from './DocView.jsx';
import EduView from './EduView.jsx';
import ContactView from './ContactView.jsx';
import TextView from './TextView.jsx';
import Vm6502 from './Vm6502.jsx';

// Switches the right-hand pane between its content views based on the current
// selection (the engine sets exactly one isX flag).
export default function RightPane({ v }) {
  return (
    <>
      {v.isInfo && <InfoCard v={v} />}
      {v.isDirPreview && <DirPreview v={v} />}
      {v.isDoc && <DocView v={v} />}
      {v.isEdu && <EduView v={v} />}
      {v.isContact && <ContactView v={v} />}
      {v.isText && <TextView v={v} />}
      {v.isVM && v.vm && <Vm6502 v={v} />}
    </>
  );
}
