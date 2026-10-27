const { execSync } = require('child_process');

// Windows / Linux / Vercel 공통: 웹 빌드 환경 설정
process.env.BUILD_TARGET = 'web';

console.log('[build:web] Building Vite web frontend...');
execSync('npx vite build', { stdio: 'inherit', env: process.env });

try {
  execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --external:vite --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit', env: process.env });
} catch (e) {
  // 웹 정적 빌드 환경에서는 서버 번들링 생략 가능
}

console.log('[build:web] Web build completed successfully.');
