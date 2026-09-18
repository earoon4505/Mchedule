# 📌 1. 메케줄 규칙 및 핵심 아키텍처 (RULES_AND_CORE.md)

이 문서는 **MapleSchedule (메케줄)** 프로젝트를 유지보수하고 기능을 추가할 때 모든 개발자 및 AI 에이전트가 **예외 없이 준수해야 하는 핵심 규칙과 절대 변경 금지 코드**를 기술합니다.

---

## 🛡️ [핵심 원칙] 10대 개발자 행동 수칙 (Core Directives)

1. **요청한 작업만 정확히 수행**:
   - 요청받은 범위만 진행하며, 다른 의견이나 아이디어가 있더라도 사용자 승인 없이 임의로 코드를 추가/수정/삭제하지 않는다.
2. **사전 제안 및 승인 후 시행**:
   - 더 좋은 방법이나 다른 의견이 있을 경우 먼저 설명하고 제안한 뒤, 사용자가 승인하면 시행한다.
3. **작업 대상 및 연관 API 정밀 분석 (과도한 전체 탐색 금지)**:
   - 변경 전 작업 대상 파일 및 직접 연동되는 API(Nexon Open API, Express 서버, Electron IPC 등)의 데이터 흐름을 정밀 분석한다.
   - 단, 수정과 무관한 프로젝트 내 모든 파일(2,000줄 이상의 대형 파일 포함)을 무작정 전수 조사하여 토큰 과부하 및 메모리 오류(`An internal error occurred`)를 유발하지 않는다.
4. **이해 내용 및 작업 계획 사전 보고**:
   - 사용자의 요청을 어떻게 이해했는지, 어떤 순서와 방식으로 처리할 것인지 명확히 보고한 후 진행한다.
5. **기능 안전성 및 아키텍처 정합성 검증**:
   - 새로운 기능 요청 시 기존 코드 구조 및 API 규격과의 충돌, 오류 발생 여부, 기존 기능 훼손 가능성을 철저히 확인하고 설계한다. 작업 완료 후에는 반드시 빌드/린트 무결성을 확인한다.
6. **기존 기능 및 코드 영향 최소화 (Side-Effect 원천 차단)**:
   - 요청받은 내용 외의 기존 코드와 기능은 절대 손상되거나 변경되지 않도록 사이드 이펙트를 완벽히 방지한다.
7. **Windows 데스크톱 앱(Electron) & 웹 듀얼 플랫폼**:
   - 이 프로젝트는 단순 웹앱이 아닌 Electron 기반 Windows 데스크톱 앱이자 Vercel 배포 웹 애플리케이션이다.
8. **데스크톱 환경 파일 및 설정 보존**:
   - `electron/` 폴더, 빌드 스크립트(`scripts/`), Windows 데스크톱 패키징 설정(`package.json`의 build, dist 스크립트 등)을 절대 임의로 삭제하거나 누락하지 않는다.
9. **데스크톱 100% 호환성 유지**:
   - 모든 신규 기능, UI 변경, 데이터 동기화, 최적화는 데스크톱 환경(`window.electronAPI`)과 웹 환경 양쪽 모두에서 100% 정상 작동하도록 호환성을 유지한다.
10. **코드 주석 및 의도 명확한 기록**:
    - 다른 AI 에이전트 및 개발자와 협업/인수인계가 원활하도록, 코드 추가/수정 시 해당 코드가 무슨 역할을 하고 어떤 의도/목적으로 추가되었는지 명확하고 상세하게 주석과 기록을 남긴다.

---

## ⚠️ 윈도우 데스크톱 애플리케이션 보존 규칙

### 1. 사용자의 데스크톱 빌드 명령어
사용자는 Windows cmd 환경에서 다음 3단계 명령어로 데스크톱 앱을 빌드합니다:
```cmd
npm install
npm install -D electron electron-builder
npm run dist
```

### 2. `package.json` 빌드 및 데스크톱 설정 절대 보존
- `"main": "electron/main.cjs"`
- `"scripts"`:
  - `"dev": "tsx server.ts"`
  - `"build": "node scripts/prepare-build.cjs && vite build && esbuild server.ts --bundle --platform=node --format=cjs --external:vite --sourcemap --outfile=dist/server.cjs"`
  - `"dist": "npm run build && electron-builder --win nsis"`
  - `"dist:win": "npm run build && electron-builder --win nsis"`
  - `"dist:portable": "npm run build && electron-builder --win portable"`
- `"build"` (electron-builder) 설정 블록(`nsis`, `portable` 타깃, 아이콘 경로 등) 유지.
- `electron`과 `electron-builder`를 `devDependencies`에 직접 커밋하지 않음 (사용자가 로컬 Windows에서 필요시 설치).

### 3. 데스크톱 핵심 파일 보존 목록
- `electron/main.cjs`: 메인 프로세스, 트레이 아이콘, PiP 창 관리, 로컬 Express 백엔드 프로세스 스폰.
- `electron/preload.cjs`: Electron ContextBridge IPC 인터페이스(`window.electronAPI`).
- `scripts/prepare-build.cjs`: Windows `.ico` 아이콘 자동 생성 빌드 전처리 스크립트.
- `BUILD_INSTALLER_GUIDE.md`: 윈도우 .exe 인스톨러 빌드 가이드 문서.
- `data/storage.json`: 오프라인 로컬 폴백 저장소.

---

## 🚨 [절대 변경 금지] 웹 & 데스크톱 듀얼 아키텍처 방어 규칙

### 1. 정적 웹 호스팅(Vercel) 환경에서의 넥슨 Open API 직접 통신 (`src/services/api.ts`)
- **원인 및 배경**: Vercel, Netlify, GitHub Pages 등 정적 웹 호스팅에서는 Node.js Express 백엔드(`server.ts`)가 구동되지 않습니다. 백엔드가 없는 정적 환경에서 `/api/...`를 호출하면 SPA 리라이트(`vercel.json`)로 인해 `index.html`(`<!doctype html>...`)이 반환되며, 이를 `res.json()`으로 파싱하면 **`Unexpected token '<', "<!doctype "... is not valid JSON`** 치명적 에러가 발생합니다.
- **필수 유지 구조**:
  - **데스크톱(Electron)**: 고성능 로컬 Express 프록시(`/api/nexon/...`) 우선 호출 (CORS 우회 및 디스크 캐싱).
  - **웹(Vercel 등 정적 웹)**: 브라우저가 직접 넥슨 공식 Open API(`https://open.api.nexon.com/...`)를 호출.
  - 모든 `/api/...` fetch 응답에 대해 `contentType.includes('application/json')` 안전 가드를 필수 유지하여 HTML 응답 파싱 에러를 원천 차단할 것.

### 2. 이미지 URL 듀얼 처리 불변 규칙 (`src/utils/image.ts`)
- **데스크톱(Electron)**: CORS 회피 및 디스크 캐싱을 위해 로컬 프록시(`/api/proxy/image?url=...`) 사용.
- **웹(Vercel 등)**: 프록시 서버가 없으므로 **넥슨 원본 CDN URL(`trimmed`)을 그대로 직접 반환**해야 합니다. 이를 임의로 다시 프록시 경로로 통일하면 웹에서 캐릭터 아바타 사진이 100% 엑박(깨짐) 처리됩니다.

### 3. 웹 환경 캐릭터 등록 시 프로필 사진 보강 로직 (`src/services/api.ts`)
- 넥슨의 `/character/list` API는 응답에 캐릭터 이름/레벨만 제공하며 `character_image` 필드가 없습니다.
- 웹 폴백 시 캐릭터 목록을 받아온 뒤, 상위 캐릭터들에 대해 브라우저가 직접 `/character/basic`을 호출하여 프로필 사진을 채워주고 `sessionStorage`에 캐시하는 보강 로직을 절대 삭제하지 마십시오.

### 4. 인게임 스케줄러 동기화 시 기존 클리어 기록 보호 가드 (`src/utils/schedulerParser.ts`)
- 넥슨 스케줄러 API가 일시적 지연이나 빈 데이터(`[]`)를 응답하더라도, 유저가 기존에 체크해둔 클리어 기록(일일/주간/보스)을 일괄 false로 날려버리지 않는 2중 안전 가드(`rawDaily.length === 0 && ...` 가드)를 절대 제거하지 마십시오.

### 5. 캐릭터 새로고침 직렬(Sequential) 구조 유지
- 넥슨 Open API의 Rate Limit(초당 호출 제한) 초과로 인한 HTTP 429 에러 및 캐릭터 누락을 방지하기 위해, 캐릭터 새로고침은 반드시 안전한 순차 처리 방식을 유지해야 합니다.

### 6. 월드리프(서버 이전) 캐릭터 자동 치유 (Self-Healing)
- 캐릭터가 월드리프 시 기존 `ocid`가 만료되어 넥슨 Open API 400 Bad Request가 발생합니다.
- 백엔드(`/api/nexon/character/...`) 및 웹 클라이언트(`fetchCharacterBasic`, `fetchNexonSchedulerState`) 모두에서 기존 OCID 실패 시 캐릭터명(`name`) 기반으로 최신 OCID를 즉시 재발급받아 내부 고유 ID를 유지한 채 자동 복구하는 메커니즘을 유지해야 합니다.

### 7. 계정 공통 컨텐츠(몬파/에픽던전) 계정(apiKeyId)별 독립 격리
- 다계정 환경에서 한 계정의 계정 공통 컨텐츠(몬스터파크, 에픽 던전)를 체크하거나 해제할 때 다른 계정의 완료 기록에 영향을 주지 않도록, 반드시 대상 계정(`targetApiKeyId` 또는 활성 캐릭터의 `apiKeyId`)에 속한 캐릭터들만 격리 업데이트해야 합니다.

### 8. `public/icons/` 에셋 보존 및 공백/비공백 2중 파일 유지 (보스/심볼 아이콘 깨짐 방지)
- **배경 및 원인**: Windows Electron 데스크톱 앱(로컬 파일 시스템)과 Vercel 웹 호스팅(브라우저 HTTP) 간의 한글 파일명 URL 인코딩/디코딩 처리 방식 차이로 인해, 한글 공백(`%20` vs 띄어쓰기)으로 인한 이미지 404 깨짐 현상이 발생할 수 있습니다.
- **2중 폴백 구조 (`MapleIcon.tsx`)**:
  - `MapleIcon.tsx`에서는 1차로 띄어쓰기가 포함된 정식 명칭 파일(예: `가디언 엔젤 슬라임.png`)을 시도하고, 인코딩 에러 등으로 실패 시 공백을 제거한 파일(예: `가디언엔젤슬라임.png`)로 2차 폴백합니다.
- **불변 원칙**:
  - 따라서 `public/icons/` 내 공백 포함/제거 보스·심볼 아이콘 쌍과 브랜드 로고 에셋(`메케줄 아이콘(투명).png`, `메케줄 앱 아이콘256.png` 등)은 **절대 중복 파일로 오인하여 삭제하지 말고 영구 보존**해야 합니다.

