# MapleSchedule (메케줄) - Agent Guidelines

## 📌 [핵심 원칙] 앞으로 꼭 지켜야 할 사항 (Core Developer Directives)
모든 AI 에이전트는 다음 10가지 원칙을 예외 없이 철저히 준수해야 합니다:

1. **요청한 작업만 정확히 수행**: 요청받은 범위만 진행하며, 다른 의견이나 아이디어가 있더라도 사용자 승인 없이 임의로 코드를 작성하거나 삭제하지 않는다.
2. **사전 제안 및 승인 후 시행**: 더 좋은 방법이나 다른 의견이 있을 경우 먼저 설명하고 제안한 뒤, 사용자가 승인하면 시행한다.
3. **코드 및 API 구조 정밀 분석**: 변경 전 관련 코드와 연동되는 API(Nexon Open API, Express 서버, Electron IPC 등)의 전체 구조와 데이터 흐름을 세밀히 파악한다.
4. **이해 내용 및 작업 계획 사전 보고**: 사용자의 요청을 어떻게 이해했는지, 어떤 순서와 방식으로 처리할 것인지 명확히 보고한 후 진행한다.
5. **기능 안전성 및 아키텍처 정합성 검증**: 새로운 기능 요청 시 기존 코드 구조 및 API 규격과의 충돌, 오류 발생 여부, 기존 기능 훼손 가능성을 철저히 확인하고 설계한다.
6. **기존 기능 및 코드 영향 최소화**: 요청받은 내용 외의 기존 코드와 기능은 절대 손상되거나 변경되지 않도록 사이드 이펙트를 완벽히 방지한다.
7. **Windows 데스크톱 앱(Electron) & 웹 듀얼 플랫폼**: 이 프로젝트는 단순 웹앱이 아닌 Electron 기반 Windows 데스크톱 앱이자 웹 애플리케이션이다.
8. **데스크톱 환경 파일 및 설정 보존**: `electron/` 폴더, 빌드 스크립트(`scripts/`), Windows 데스크톱 패키징 설정(`package.json`의 build, dist 스크립트 등)을 절대 임의로 삭제하거나 누락하지 않는다.
9. **데스크톱 100% 호환성 유지**: 모든 신규 기능, UI 변경, 데이터 동기화, 최적화는 데스크톱 환경(`window.electronAPI`)과 웹 환경 양쪽 모두에서 100% 정상 작동하도록 호환성을 유지한다.
10. **코드 주석 및 의도 명확한 기록**: 다른 AI 에이전트와 협업 및 인수인계가 원활하도록, 코드 추가/수정 시 해당 코드가 무슨 역할을 하고 어떤 의도/목적으로 추가되었는지 명확하고 상세하게 주석과 기록을 남긴다.

---

## ⚠️ CRITICAL INSTRUCTION: Desktop Application Preservation (1.0.3 기준)
This project is an Electron-based **Windows Desktop Application** and Web Application.
All AI agents working on this project MUST strictly follow these rules:

1. **User's Exact Desktop Build Workflow**:
   The user builds the Windows desktop app using these exact three commands in cmd:
   ```cmd
   npm install
   npm install -D electron electron-builder
   npm run dist
   ```

2. **Preserve `package.json` Build & Desktop Configuration**:
   - `"main": "electron/main.cjs"`
   - `"scripts"`:
     - `"dev": "tsx server.ts"`
     - `"build": "node scripts/prepare-build.cjs && vite build && esbuild server.ts --bundle --platform=node --format=cjs --external:vite --sourcemap --outfile=dist/server.cjs"`
     - `"dist": "npm run build && electron-builder --win nsis"`
     - `"dist:win": "npm run build && electron-builder --win nsis"`
     - `"dist:portable": "npm run build && electron-builder --win portable"`
   - Keep `"build"` (electron-builder) configuration block intact with `nsis` and `portable` targets.
   - Do NOT commit `electron` and `electron-builder` to `devDependencies` directly; the user installs them locally on Windows via `npm install -D electron electron-builder`.

3. **DO NOT delete or alter Desktop / Electron configuration files**:
   - `electron/main.cjs` (Window management, tray, PiP window, local server spawner)
   - `electron/preload.cjs` (Electron ContextBridge IPC)
   - `scripts/prepare-build.cjs` (Windows .ico generator)
   - `BUILD_INSTALLER_GUIDE.md` (Windows .exe build documentation)
   - `data/storage.json` (Local fallback storage)

4. **Dual Compatibility (Web & Desktop)**:
   - Any new feature or optimization must remain compatible with both the browser environment and Electron's desktop environment (`window.electronAPI`).
   - Do NOT add unnecessary root files unless requested by the user. Keep the root structure clean and identical to standard conventions.
