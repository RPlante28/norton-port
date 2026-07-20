import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import './index.css';

// No StrictMode: the engine's mount sets up boot timers, key/pointer listeners
// and audio; StrictMode's double-invoke in dev would run them twice.
createRoot(document.getElementById('root')).render(<App />);
