# MapleSchedule (메케줄) - Agent Guidelines

## 📌 [핵심 원칙] 앞으로 꼭 지켜야 할 10대 수칙 (Core Developer Directives)
모든 AI 에이전트는 다음 10가지 원칙을 예외 없이 철저히 준수해야 합니다:

1. **요청한 작업만 정확히 수행**: 요청받은 범위만 진행하며, 다른 의견이나 아이디어가 있더라도 사용자 승인 없이 임의로 코드를 작성하거나 삭제하지 않는다.
2. **사전 제안 및 승인 후 시행**: 더 좋은 방법이나 다른 의견이 있을 경우 먼저 설명하고 제안한 뒤, 사용자가 승인하면 시행한다.
3. **작업 대상 및 연관 API 정밀 분석 (과도한 전체 탐색 금지)**: 변경 전 작업 대상 파일과 직접 연동되는 API(Nexon Open API, Express 서버, Electron IPC 등)의 데이터 흐름을 정밀 분석한다. 단, 무관한 전체 파일을 전수 조사하여 토큰 과부하를 유발하지 않는다.
4. **이해 내용 및 작업 계획 사전 보고**: 사용자의 요청을 어떻게 이해했는지, 어떤 순서와 방식으로 처리할 것인지 명확히 보고한 후 진행한다.
5. **기능 안전성 및 아키텍처 정합성 검증**: 새로운 기능 요청 시 기존 코드 구조 및 API 규격과의 충돌, 오류 발생 여부, 기존 기능 훼손 가능성을 철저히 확인하고 설계한다.
6. **기존 기능 및 코드 영향 최소화**: 요청받은 내용 외의 기존 코드와 기능은 절대 손상되거나 변경되지 않도록 사이드 이펙트를 완벽히 방지한다.
7. **Windows 데스크톱 앱(Electron) & 웹 듀얼 플랫폼**: 이 프로젝트는 단순 웹앱이 아닌 Electron 기반 Windows 데스크톱 앱이자 웹 애플리케이션이다.
8. **데스크톱 환경 파일 및 설정 보존**: `electron/` 폴더, 빌드 스크립트(`scripts/`), Windows 데스크톱 패키징 설정(`package.json`의 build, dist 스크립트 등)을 절대 임의로 삭제하거나 누락하지 않는다.
9. **데스크톱 100% 호환성 유지**: 모든 신규 기능, UI 변경, 데이터 동기화, 최적화는 데스크톱 환경(`window.electronAPI`)과 웹 환경 양쪽 모두에서 100% 정상 작동하도록 호환성을 유지한다.
10. **코드 주석 및 의도 명확한 기록**: 다른 AI 에이전트와 협업 및 인수인계가 원활하도록, 코드 추가/수정 시 해당 코드가 무슨 역할을 하고 어떤 의도/목적으로 추가되었는지 명확하고 상세하게 주석과 기록을 남긴다.

---

## 🚨 [시스템 무결성 가드] 'An internal error occurred' 및 24KB 초과 방지 규칙
AI Studio 플랫폼에서 토큰 한도 초과 및 세션 과부하로 인한 내부 500 오류가 재발하지 않도록 아래 규칙을 엄격히 준수합니다:

1. **`AGENTS.md` 크기 15KB 상한 유지**:
   - `AGENTS.md`는 시스템 프롬프트에 자동 주입되며 24KB 초과 시 강제 절단(`TRUNCATED`)됩니다.
   - 따라서 이 파일에는 **핵심 행동 원칙과 절대 보존 가드**만 압축하여 항상 **15KB 이하**로 가볍게 유지합니다.
2. **세부 문서 및 변경 내역 분리 작성 원칙**:
   - 장문의 변경 내역(Changelog)이나 데이터 명세는 `AGENTS.md`에 누적하지 말고, 반드시 `docs/` 내의 해당 목적별 마크다운 파일(예: `docs/changelogs/v1.0.X.md`)에 분리하여 작성합니다.
3. **과도한 전수 파일 탐색 금지**:
   - 수정 요청을 받았을 때 프로젝트 내 수십 개 파일이나 2,000줄 이상의 대형 파일(`App.tsx`) 전체를 무작정 한 번에 읽지 않습니다.
   - 반드시 **수정과 직접 관련된 컴포넌트, 인터페이스, 유틸리티만 선별하여 정밀하게 확인**합니다.

---

## ⚠️ 데스크톱(Electron) 환경 보존 필수 규칙
1. **데스크톱 빌드 명령어 보존**:
   ```cmd
   npm install
   npm install -D electron electron-builder
   npm run dist
   ```
2. **`package.json` 데스크톱 빌드 설정 보존**:
   - `"main": "electron/main.cjs"`
   - `"scripts"`: `dev`, `build`, `dist`, `dist:win`, `dist:portable` 유지.
   - `build` (electron-builder) 설정 블록 유지 (`nsis`, `portable` 타깃, 아이콘 설정).
3. **데스크톱 파일 절대 보존**:
   - `electron/main.cjs`, `electron/preload.cjs`, `scripts/prepare-build.cjs`, `BUILD_INSTALLER_GUIDE.md`, `data/storage.json`

---

## 🚨 [절대 변경 금지] 웹(Vercel) & 데스크톱 듀얼 핵심 가드
1. **Vercel 정적 호스팅 넥슨 API 직접 통신 (`src/services/api.ts`)**:
   - 데스크톱은 로컬 Express 프록시 우선, 웹은 브라우저에서 `https://open.api.nexon.com` 직접 통신. `contentType.includes('application/json')` 방어 가드 필수.
2. **이미지 URL 듀얼 분기 (`src/utils/image.ts`)**:
   - 데스크톱은 `/api/proxy/image` 프록시, 웹은 넥슨 원본 CDN URL 직접 반환.
3. **인게임 스케줄러 동기화 클리어 기록 보호 가드 (`src/utils/schedulerParser.ts`)**:
   - 넥슨 API 빈 데이터(`[]`) 응답 시 기존 체크 기록 일괄 초기화 방지 2중 가드 보존.
4. **다계정 분리 및 계정 공통 컨텐츠 독립 격리**:
   - 몬스터파크/에픽던전 체크 시 활성 계정(`apiKeyId`) 캐릭터들만 격리 업데이트.
5. **월드리프(서버 이전) 캐릭터 자동 치유 (Self-Healing)**:
   - 만료된 OCID 발생 시 닉네임으로 최신 OCID 자동 재발급 및 캐릭터 고유 ID/기록 100% 보존.
6. **`public/icons/` 에셋 보존 및 공백 2중 파일 유지 (아이콘 깨짐 방지)**:
   - `public/icons/` 내 보스/심볼 아이콘(공백 포함 및 공백 제거 2벌 파일)과 로고 에셋(`메케줄 아이콘(투명).png` 등)은 절대 임의 삭제 금지.
   - `MapleIcon.tsx`에서 Windows Electron과 웹 간 URL 디코딩/인코딩 차이로 인한 이미지 깨짐을 방지하는 2중 폴백(`encoded` ➔ `compactEncoded`) 구조로 설계되어 있으므로 영구 보존.

---

## 📚 프로젝트 세부 문서 체계 (Reference Docs)
자세한 기술 명세, 데이터 모델 및 개발 이력은 아래 전용 문서를 참조하십시오:

1. **[규칙 및 핵심 아키텍처]**: `docs/RULES_AND_CORE.md`
2. **[데이터 구조 명세서]**: `docs/DATA_STRUCTURE.md`
3. **[기능 설명 요약서]**: `docs/FEATURES_SUMMARY.md`
4. **[코딩 스타일 및 개발 지침]**: `docs/CODING_STYLE.md`
5. **[버전별 업데이트 상세 내역]**:
   - v1.0.5 상세 내역: `docs/changelogs/v1.0.5.md`
   - v1.0.4 상세 내역: `docs/changelogs/v1.0.4.md`
