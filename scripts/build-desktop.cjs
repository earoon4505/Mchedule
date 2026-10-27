const { execSync } = require('child_process');
const path = require('path');

// Windows / Linux / macOS 공통: 데스크톱 빌드 환경 설정
process.env.BUILD_TARGET = 'desktop';

console.log('[build:desktop] 1. Preparing desktop build assets and icons...');
require('./prepare-build.cjs');

console.log('[build:desktop] 2. Building Vite desktop frontend...');
execSync('npx vite build', { stdio: 'inherit', env: process.env });

console.log('[build:desktop] 3. Bundling server with esbuild...');
execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --external:vite --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit', env: process.env });

console.log('[build:desktop] Desktop build completed successfully.');
