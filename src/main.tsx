import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StandalonePiPView } from './components/pip/StandalonePiPView.tsx';
import './index.css';

const isPiP = window.location.search.includes('pip=') || window.location.hash.includes('pip');

if (isPiP) {
  document.documentElement.style.background = 'transparent';
  document.documentElement.style.backgroundColor = 'transparent';
  document.documentElement.classList.add('pip-mode-body');
  document.body.style.background = 'transparent';
  document.body.style.backgroundColor = 'transparent';
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.style.background = 'transparent';
    rootEl.style.backgroundColor = 'transparent';
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPiP ? <StandalonePiPView /> : <App />}
  </StrictMode>,
);

