# 🎨 4. 메케줄 코딩 스타일 및 개발 지침 (CODING_STYLE.md)

이 문서는 **MapleSchedule (메케줄)** 프로젝트의 일관된 코드 품질 유지, 듀얼 플랫폼 호환성 확보 및 AI 에이전트 간 원활한 협업을 위한 코딩 표준을 정의합니다.

---

## 1. 듀얼 플랫폼 분기 표준 패턴

메케줄은 웹(Vercel 정적 호스팅)과 데스크톱(Electron) 양쪽에서 완벽히 구동되어야 합니다. 플랫폼 종속적 기능을 작성할 때는 항상 아래 표준 패턴을 사용하십시오:

```typescript
import { isElectron, isWeb, supportsPiP } from '@/src/utils/platform';

// 1. 데스크톱 Electron 환경 판별
if (isElectron && window.electronAPI) {
  // Electron IPC 호출 (윈도우 제어, 트레이, 시스템 알림 등)
  window.electronAPI.minimizeWindow();
} else {
  // 웹 브라우저 대체 동작
}

// 2. 이미지 URL 분기 표준
import { getSafeAvatarUrl } from '@/src/utils/image';
// 데스크톱은 로컬 Express 프록시, 웹은 넥슨 CDN 원본 URL 자동 반환
const avatarSrc = getSafeAvatarUrl(character.characterImage);
```

---

## 2. React 컴포넌트 및 Hook 가이드라인

- **함수형 컴포넌트 전용**: 모든 컴포넌트는 TypeScript 함수형 컴포넌트로 작성합니다.
- **의존성 배열(Dependencies Array) 안전성**:
  - `useEffect`의 의존성 배열에는 객체나 배열의 직접 참조 대신 원시값(string, number, boolean)을 사용하거나 `useCallback`, `useRef`를 활용하여 무한 리렌더링을 원천 차단합니다.
- **모듈화 및 단일 책임 원칙**:
  - `App.tsx`와 같은 대형 파일에 모든 비즈니스 로직을 몰아넣지 말고, 재사용 가능한 모달, 카드, 훅, 유틸리티는 반드시 `components/`, `utils/`, `services/`로 분리 추출합니다.

---

## 3. Tailwind CSS 및 UI 스타일링 규칙

- **CSS 유틸리티 클래스 사용**: Tailwind CSS 클래스를 직접 사용하며, 임의의 인라인 `style={{ ... }}` 속성이나 별도 `.css` 파일 생성을 지양합니다.
- **다크 모드 지원**:
  - 최상위 HTML의 `.dark` 클래스를 기반으로 동작합니다.
  - 모든 색상 지정 시 `text-slate-800 dark:text-slate-100`, `bg-white dark:bg-slate-900`, `border-slate-200 dark:border-slate-800` 등 라이트/다크 대응 쌍을 항상 명시합니다.
- **안티-슬롭(Anti-Slop) 디자인 철학**:
  - 어색한 보라색-시안 그라데이션, 과도한 네온 글로우 효과, 1px 테두리와 거대한 그림자가 섞인 유령 카드를 배제합니다.
  - 수학적으로 정렬된 패딩(내부 패딩보다 항상 크거나 같은 컨테이너 패딩)과 고대비 가독성(WCAG AA 준수)을 유지합니다.
- **HTML `id` 속성**: 버튼, 모달, 메인 카드 등 인터랙션이 발생하는 주요 요소에는 고유한 `id` 속성을 부여하여 디버깅 및 자동화 타깃팅을 보장합니다.

---

## 4. 아이콘 및 애니메이션 규격

- **일반 UI 아이콘**: 모든 시스템 아이콘은 `lucide-react`에서 named import로 가져옵니다.
- **메이플 전용 아이콘**:
  - 메이플스토리 인게임 보스 및 심볼 아이콘은 `MapleIcon.tsx` 컴포넌트를 통해 `public/icons/` 내의 한글 파일명 리소스와 1:1 매핑하여 렌더링합니다.
- **모션 애니메이션**:
  - 반드시 `motion/react` (Motion v12)를 사용합니다.
  - 스프링 애니메이션 파라미터는 자연스러운 물리 피드백을 위해 `type: 'spring', stiffness: 450~550, damping: 28~32` 규격을 권장합니다.

---

## 5. 코드 주석 및 협업 기록 원칙 (필수)

다른 AI 에이전트 및 인간 개발자가 이전 작업의 의도를 즉각 파악할 수 있도록, 신규 로직이나 중요한 수정 사항에는 다음 정보를 주석으로 명시합니다:

```typescript
/**
 * [의도/목적]: 다계정 환경에서 활성 계정의 변경 시 계정 공통 컨텐츠가 타 계정으로 오염되는 현상 방지
 * [역할]: targetApiKeyId가 주어지면 해당 계정에 속한 캐릭터들의 레코드만 격리하여 업데이트
 * [호환성]: Web 브라우저 및 Electron 데스크톱 양쪽 동일 적용
 */
export function handleToggleCommonTask(taskId: string, targetApiKeyId?: string) { ... }
```

---

## 6. AI 에이전트 안전 작업 및 빌드 검증

- **안전한 분석**: 수정 대상과 관련된 코드와 인터페이스만 정밀하게 조회하며, 전체 코드베이스를 무의미하게 전수 탐색하지 않습니다.
- **빌드 및 린트 검증**: 코드 작성 후에는 반드시 `compile_applet` 또는 `lint_applet`을 실행하여 문법 오류, 누락된 임포트, 타입 에러를 100% 검증한 후 턴을 마칩니다.
