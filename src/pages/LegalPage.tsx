import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { APP_LOGO_SRC, onLogoError } from '../utils/image';
import { LegalTab } from '../components/legal/LegalModal';

interface LegalPageProps {
  initialTab?: LegalTab;
}

/**
 * 메케줄(MapleSchedule) 서비스 이용약관 및 개인정보처리방침 독립 웹 페이지 (/terms, /privacy)
 * 
 * [설계 의도]
 * 1. 구글 애드센스 승인 필수 요건: 독립된 정식 URL로 접속 가능한 완벽한 운영 정책 및 개인정보처리방침
 * 2. 제9조 온라인 맞춤형 광고 및 Google 쿠키 정책(google.com/settings/ads) 전문 상시 수록
 * 3. 깔끔한 네비게이션: 언제든 '← 메케줄 홈으로' 복귀 가능
 */
export const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    document.title = initialTab === 'privacy'
      ? '개인정보처리방침 - 메케줄(MapleSchedule)'
      : '서비스 이용약관 - 메케줄(MapleSchedule)';
    window.scrollTo(0, 0);

    // body의 overflow-hidden을 일시적으로 해제하여 부드러운 스크롤 허용
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [initialTab]);

  const handleSwitchTab = (tab: LegalTab) => {
    setActiveTab(tab);
    setExpandedSection(null);
    const newPath = tab === 'privacy' ? '/privacy' : '/terms';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    document.title = tab === 'privacy'
      ? '개인정보처리방침 - 메케줄(MapleSchedule)'
      : '서비스 이용약관 - 메케줄(MapleSchedule)';
  };

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const navigateToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#F8F9FB] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white custom-scrollbar">
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              onClick={navigateToHome}
              className="flex items-center gap-2 group cursor-pointer"
              title="메케줄 메인 스케줄러 홈으로 이동"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img src={APP_LOGO_SRC} alt="메케줄" onError={onLogoError} className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                메케줄
              </span>
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              운영 정책 및 법적 고지
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              onClick={navigateToHome}
              className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>메케줄 홈으로</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. 본문 컨테이너 */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* 상단 탭 스위처 */}
        <div className="flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs gap-1.5">
          <button
            type="button"
            onClick={() => handleSwitchTab('terms')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>서비스 이용약관</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchTab('privacy')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>개인정보처리방침</span>
          </button>
        </div>

        {/* 안내 카드 */}
        <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="font-bold text-orange-900 dark:text-orange-300 mb-1 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-orange-600" />
            <span>메케줄 법적 운영 정책 안내</span>
          </p>
          <p>
            본 약관 및 개인정보처리방침은 공정거래위원회 표준약관 및 넥슨 Open API 이용정책, 그리고 정보통신망법 및 개인정보보호법을 준수합니다. 메케줄은 중앙 서버에 어떠한 개인정보나 게임 비밀번호를 수집·저장하지 않는 100% 로컬 프라이버시 원칙을 고수합니다.
          </p>
        </div>

        {/* 탭 1: 이용약관 */}
        {activeTab === 'terms' ? (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제1조 (목적)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                본 약관은 "메케줄(MapleSchedule)"(이하 "서비스")을 제공하는 운영자와 서비스를 이용하는 이용자 간에 서비스의 이용 조건, 절차 및 권리·의무, 책임사항 등 제반 사항을 규정함을 목적으로 합니다.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제2조 (용어의 정의)</h3>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                <li><strong>"서비스"</strong>란 운영자가 제작하여 웹 브라우저 및 Windows 데스크톱 애플리케이션 형태로 제공하는 메이플스토리 스케줄 관리 및 통계 유틸리티를 의미합니다.</li>
                <li><strong>"이용자"</strong>란 본 약관에 따라 서비스를 이용하는 모든 자를 의미합니다.</li>
                <li><strong>"NEXON Open API"</strong>란 (주)넥슨코리아가 공식 제공하는 메이플스토리 게임 데이터 조회용 애플리케이션 프로그래밍 인터페이스를 말합니다.</li>
                <li><strong>"API Key"</strong>란 넥슨 Open API 센터에서 이용자가 직접 발급받아 서비스에 등록하는 인증 식별값을 말합니다.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제3조 (약관의 효력 및 개정)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                ① 본 약관은 서비스 웹사이트 및 애플리케이션 내에 게시함으로써 효력이 발생합니다.<br />
                ② 운영자는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 개정된 약관은 공지사항 또는 모달을 통해 사전에 공지합니다.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제4조 (서비스의 내용 및 제공)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                ① 메케줄은 메이플스토리 유저를 위한 무료 팬 메이드 유틸리티로 다음과 같은 기능을 제공합니다:
              </p>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                <li>NEXON Open API 연동 캐릭터 정보 및 일일/주간/월간 스케줄 상태 자동 조회</li>
                <li>일일 퀘스트(심볼), 일일 보스, 주간 레이드 보스 체크리스트 관리</li>
                <li>주간 강렬한 힘의 결정석 정산액 실시간 계산 및 60개 제한 현황 제공</li>
                <li>개인 맞춤형 커스텀 숙제 등록 및 초기화 관리</li>
                <li>Windows 데스크톱 미니 위젯(PiP) 및 실시간 동기화</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제5조 (데이터의 보관 및 백업)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                ① 본 서비스는 사용자의 개인정보와 API 키, 캐릭터 체크 데이터를 중앙 서버에 수집하지 않으며, 전적으로 이용자의 단말기(브라우저 LocalStorage 및 PC 로컬)에만 저장합니다.<br />
                ② 브라우저 캐시 삭제나 기기 변경 시 데이터 유실을 방지하기 위하여, 이용자는 상단 설정의 <strong>[데이터 백업/내보내기]</strong> 기능을 이용하여 수시로 데이터를 백업할 것을 권장합니다.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제6조 (광고의 게재)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                운영자는 서비스의 지속적인 무료 제공과 서버·시스템 유지보수를 위하여 웹 브라우저 환경에 온라인 광고를 게재할 수 있습니다. 광고 게재에 따른 쿠키 및 이용자 권리는 개인정보처리방침 제9조에 따릅니다.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제7조 (면책 조항)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                ① 본 서비스는 넥슨코리아의 공식 서비스가 아니며, 넥슨 Open API에서 제공하는 데이터의 정확성 및 넥슨 게임 서버의 정기/임시 점검으로 인한 조회 지연에 대해 운영자는 책임을 부담하지 않습니다.<br />
                ② 천재지변, 넥슨 서버 장애, 이용자의 부주의로 인한 로컬 캐시 삭제 등에 따른 손해에 대해 운영자는 책임을 지지 않습니다.
              </p>
            </div>
          </div>
        ) : (
          /* 탭 2: 개인정보처리방침 */
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제1조 (개인정보의 처리 목적)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                메케줄(MapleSchedule)은 개인정보보호법 제30조에 따라 이용자의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여 본 방침을 수립·공개합니다. 본 서비스는 회원가입 없이 이용 가능하며, 넥슨 API 조회를 위한 식별값 외에 주민등록번호, 계정 비밀번호 등 어떠한 민감 개인정보도 수집하지 않습니다.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제2조 (수집하는 개인정보 항목 및 저장 방식)</h3>
              <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                <li><strong>처리 항목</strong>: 이용자가 직접 입력한 넥슨 Open API Key, 캐릭터 이름, 직업, 레벨, 캐릭터 식별자(OCID), 일일/주간 숙제 체크 기록</li>
                <li><strong>저장 위치</strong>: 이용자 본인의 단말기 로컬 저장소 (브라우저 LocalStorage 및 Electron 로컬 파일)에만 100% 저장</li>
                <li><strong>외부 서버 비전송 원칙</strong>: 개발자의 외부 중앙 서버로 일체 전송되지 않음</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제3조 (개인정보의 처리 및 보유 기간)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                중앙 서버 DB가 존재하지 않으므로, 데이터의 보유 기간은 이용자의 이용 의사에 따릅니다. 사용자가 <strong>앱 내 [설정 → 데이터 초기화]</strong>를 누르거나 브라우저 캐시를 삭제하면 즉시 지체 없이 완전 영구 파기됩니다.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제4조 (제3자 제공 및 업무 위탁의 부존재)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                본 서비스는 어떠한 개인정보도 제3자에게 제공하거나 판매하지 않으며, 처리를 위탁하지 않습니다. 단, 캐릭터 데이터 조회를 위해 브라우저에서 넥슨 공식 서버(<code>open.api.nexon.com</code>)로 직접 HTTPS 통신 조회가 발생합니다.
              </p>
            </div>

            {/* 제9조 (온라인 맞춤형 광고 및 쿠키 운영 안내) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                제9조 (온라인 맞춤형 광고 및 쿠키(Cookie) 운영 안내)
              </h3>
              <div className="text-slate-600 dark:text-slate-400 space-y-1.5 text-xs sm:text-sm">
                <p>① 메케줄은 웹 브라우저 환경에서 서비스의 지속적인 무료 제공과 유지를 위하여 Google 등 제3자 광고 사업자가 제공하는 온라인 광고를 게재할 수 있습니다.</p>
                <p>② Google을 비롯한 제3자 공급업체는 <strong>쿠키(Cookie)</strong>를 사용하여 이용자의 이전 웹사이트 방문 기록 등을 바탕으로 맞춤형 광고를 게재할 수 있습니다.</p>
                <p>③ Google의 광고 쿠키 사용으로 Google 및 파트너사는 이용자의 본 웹사이트 및 인터넷상의 다른 웹사이트 방문 기록을 바탕으로 관련성 높은 광고를 게재할 수 있습니다.</p>
                <p>④ 이용자는 언제든지 맞춤형 광고 게재를 위한 쿠키 사용을 선택 해제(거부)할 수 있습니다:
                  <br />• <strong>Google 맞춤형 광고 설정 해제</strong>: <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 underline font-bold inline-flex items-center gap-0.5">Google 광고 설정 (www.google.com/settings/ads) <ExternalLink className="w-3 h-3" /></a>
                  <br />• <strong>제3자 광고업체 맞춤 광고 차단</strong>: <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 underline font-bold inline-flex items-center gap-0.5">AboutAds 페이지 (www.aboutads.info) <ExternalLink className="w-3 h-3" /></a>
                  <br />• <strong>웹 브라우저 환경설정</strong>: 브라우저 설정 메뉴에서 모든 쿠키를 거부하거나 쿠키 저장 시 알림을 설정할 수 있습니다.
                </p>
                <p>⑤ 이용자가 쿠키 설치를 거부하거나 맞춤형 광고를 해제하더라도 메케줄의 기본 스케줄러 기능, 캐릭터 등록, 인게임 동기화 등 모든 서비스 기능은 아무런 제한 없이 100% 정상 이용할 수 있습니다.</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">제10조 (개인정보 보호책임자 및 공식 문의)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                • <strong>공식 문의 이메일</strong>: <strong>mchedule4505@gmail.com</strong><br />
                • <strong>서비스 시행일</strong>: 2026년 10월 1일 (최신 개정 완료)
              </p>
            </div>
          </div>
        )}

        {/* 하단 푸터 */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span>Data based on NEXON Open API | MapleStory © NEXON Korea Corp.</span>
          <div className="flex items-center gap-3">
            <a href="/guide" className="hover:text-slate-700 dark:hover:text-slate-200 underline">
              이용 가이드 & 공략
            </a>
            <span>·</span>
            <a href="/" onClick={navigateToHome} className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
              스케줄러 홈으로 이동
            </a>
          </div>
        </div>

      </main>
    </div>
  );
};
