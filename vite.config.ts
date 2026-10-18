import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  // 데스크톱 환산 기능 활성화 조건:
  // 1. 데스크톱 패키징 빌드 시 (BUILD_TARGET === 'desktop')
  // 2. 로컬 개발 서버 실행 시 (command === 'serve' && BUILD_TARGET !== 'web')
  // 반면, 웹 빌드(Vercel 환경 또는 BUILD_TARGET === 'web') 시에는 환산 코드가 번들에서 100% 자동 도려내어짐(Tree-Shaking)
  const isWebBuild = process.env.BUILD_TARGET === 'web' || !!process.env.VERCEL;
  const isDesktopScouter = !isWebBuild && (process.env.BUILD_TARGET === 'desktop' || command === 'serve');

  const aliases: Record<string, string> = {
    '@': path.resolve(__dirname, '.'),
  };

  // 웹 빌드 시: 환산/스카우터 관련 컴포넌트를 빈 stub으로 대체하여 번들에서 완전 제거(0바이트)
  if (!isDesktopScouter) {
    aliases['@/components/conversion/ConversionPageView'] = path.resolve(
      __dirname,
      'src/components/conversion/ConversionPageView.web.tsx'
    );
    aliases['./components/conversion/ConversionPageView'] = path.resolve(
      __dirname,
      'src/components/conversion/ConversionPageView.web.tsx'
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __DESKTOP_SCOUTER_ENABLED__: JSON.stringify(isDesktopScouter),
    },
    resolve: {
      alias: aliases,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
