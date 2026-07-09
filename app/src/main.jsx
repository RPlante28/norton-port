import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import PrintResume from './components/PrintResume.jsx';
import './index.css';

// No StrictMode: the engine's mount sets up boot timers, key/pointer listeners
// and audio; StrictMode's double-invoke in dev would run them twice.
createRoot(document.getElementById('root')).render(<App />);

// The printable one-page resume lives OUTSIDE #root so it can show while the
// DOS UI (#root) is hidden under @media print.
const printMount = document.createElement('div');
document.body.appendChild(printMount);
createRoot(printMount).render(<PrintResume />);
