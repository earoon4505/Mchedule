# 🍁 메케줄 (MapleSchedule) - 윈도우 설치 파일(.exe) 빌드 및 배포 가이드

이 프로젝트는 클릭 한 번으로 배포 가능한 **Windows 설치 프로그램(`메케줄 Setup 1.0.0.exe`)** 및 **무설치 포터블 실행 파일(`메케줄 1.0.0.exe`)**을 생성할 수 있도록 완벽히 최적화되어 있습니다.

---

## 🛠️ 준비 사항
1. **Windows PC**에 [Node.js (LTS 버전 권장)](https://nodejs.org/)가 설치되어 있어야 합니다.
2. AI Studio의 우측 상단 메뉴 또는 **GitHub/ZIP 다운로드**를 통해 소스 코드를 PC의 원하는 폴더에 내려받고 압축을 풉니다.

---

## 🚀 윈도우 설치 파일(.exe) 제작 방법 (초간단)

프로젝트 폴더에서 터미널(명령 프롬프트 `cmd` 또는 `PowerShell`)을 열고 아래 명령어를 순서대로 실행합니다:

### 1단계: 패키지 설치
```bash
npm install
npm install -D electron electron-builder
```

### 2단계: 설치형(.exe) 또는 무설치 포터블(.exe) 빌드

- **권장: 윈도우 설치 프로그램(`Setup.exe`) 생성**
  ```bash
  npm run dist
  ```
  *(바탕화면 및 시작 메뉴 바로가기 자동 생성, 제어판 프로그램 추가/제거 지원)*

- **선택: 설치 없이 바로 실행되는 단일 무설치 포터블(`Portable.exe`) 생성**
  ```bash
  npm run dist:portable
  ```

---

## 📦 생성된 배포용 .exe 파일 확인

빌드가 완료되면 프로젝트 루트 내 **`release/`** 폴더에 실행 파일이 생성됩니다:
- `release/메케줄 Setup 1.0.0.exe` (다른 사람에게 전송/배포할 수 있는 정식 인스톨러)
- `release/메케줄 1.0.0.exe` (USB나 폴더에서 바로 켜는 무설치 단일 실행 파일)

---

## 💡 배포 및 실행 시 팁

1. **Windows SmartScreen(PC 보호) 안내가 뜰 때**:
   - 직접 빌드한 개인 프로그램의 경우 코드 서명(인증서)이 없으므로 파란색 SmartScreen 창이 뜰 수 있습니다.
   - **[추가 정보] 클릭 → [실행]**을 누르면 정상적으로 1초 만에 설치 및 실행됩니다.
2. **독립 PiP(Always-on-Top) 모드**:
   - 메이플스토리 게임 플레이 중 화면 위를 가리지 않고 실시간 체크리스트를 확인하고 조작할 수 있습니다.
3. **NEXON Open API 연동**:
   - API 키는 사용자 PC의 `%APPDATA%/MapleSchedule/data/` 폴더에 안전하게 보관되며, 언제든 설정 창에서 변경 및 확인이 가능합니다.
