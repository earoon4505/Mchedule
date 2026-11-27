import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { StandalonePiPView } from './components/pip/StandalonePiPView.tsx';
import { GuidePage } from './pages/GuidePage.tsx';
import { LegalPage } from './pages/LegalPage.tsx';
import { LOCAL_STORAGE_DATA_KEY } from './utils/platform';
import './index.css';

const isPiP = window.location.search.includes('pip=') || window.location.hash.includes('pip');

// 독립 웹페이지(/guide, /terms, /privacy) 진입 시 저장된 다크모드 및 색상 프리셋 상태를 즉시 DOM에 동기화
function syncDocumentThemeFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isDark = !!parsed?.settings?.darkMode;
      const lightTheme = parsed?.settings?.lightTheme === 'cream' ? 'cream' : 'classic';
      const darkTheme = parsed?.settings?.darkTheme === 'classic' ? 'classic' : 'deep';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.dataset.lightTheme = lightTheme;
      document.documentElement.dataset.darkTheme = darkTheme;
      return;
    }
  } catch (_) {}
  document.documentElement.classList.remove('dark');
  document.documentElement.dataset.lightTheme = 'classic';
  document.documentElement.dataset.darkTheme = 'deep';
}

if (!isPiP && window.location.pathname !== '/') {
  syncDocumentThemeFromStorage();
}

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

/**
 * 메케줄 최상위 라우터
 * 1. PiP 미니 뷰 (독립 창)
 * 2. /guide -> 독립 가이드 & 공략 웹페이지
 * 3. /terms -> 서비스 이용약관 독립 웹페이지
 * 4. /privacy -> 개인정보처리방침 독립 웹페이지
 * 5. / -> 메인 스케줄러 애플리케이션
 */
function RootApp() {
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isPiP && currentPath !== '/') {
      syncDocumentThemeFromStorage();
      const handleStorage = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_DATA_KEY) {
          syncDocumentThemeFromStorage();
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [currentPath]);

  if (isPiP) {
    return <StandalonePiPView />;
  }

  // 정식 하위 웹페이지 라우팅
  if (currentPath === '/guide') {
    return <GuidePage />;
  }
  if (currentPath === '/terms') {
    return <LegalPage initialTab="terms" />;
  }
  if (currentPath === '/privacy') {
    return <LegalPage initialTab="privacy" />;
  }

  // 메인 스케줄러 본체
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);
