import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/expose-supabase.js'; // Importer le script d'exposition de Supabase
import './lib/console-protection'; // Protect console in production
import './lib/debug-vehicles'; // Debug helper for vehicles (dev only)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
