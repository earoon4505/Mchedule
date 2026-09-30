import React, { useEffect } from 'react';
import { 
  BookOpen, 
  ArrowLeft, 
  Key, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Users, 
  Package, 
  Plus, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { APP_LOGO_SRC, onLogoError } from '../utils/image';
import { AdSenseBanner } from '../components/ads/AdSenseBanner';

/**
 * 메케줄 공식 이용 가이드 (/guide)
 * 
 * [디자인 가이드라인]
 * 1. 통일된 디자인 시스템: 오렌지 포인트(#f97316)와 뉴트럴 슬레이트 톤으로 시각적 일관성 확보
 * 2. 가독성 극대화: 단정한 카드 레이아웃, 일관된 패딩/마진, 정돈된 타이포그래피 계층
 * 3. 듀얼 플랫폼 호환 및 스크롤 완벽 지원
 */
export const GuidePage: React.FC = () => {
  useEffect(() => {
    document.title = '메케줄 가이드 - MapleSchedule';
    window.scrollTo(0, 0);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

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
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
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
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              이용 가이드
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
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        
        {/* 대제목 (Hero) */}
        <section className="text-center space-y-2.5 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 text-orange-600 dark:text-orange-400 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>공식 이용 가이드</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            메케줄 가이드
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            메케줄의 핵심 기능과 넥슨 Open API 연동법, 자주 묻는 질문(FAQ)을 안내합니다.
          </p>
        </section>

        {/* 상단 애드센스 광고 영역 */}
        <div className="my-4">
          <AdSenseBanner />
        </div>

        {/* 목차 (TOC) - 단정하고 깔끔한 통일 규격 */}
        <nav className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            목차 바로가기
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-medium">
            <a href="#section-1" className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2">
                <span className="w-4 text-orange-500 font-bold text-[11px]">01</span>
                <span>메케줄 소개 및 7대 핵심 기능</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a href="#section-2" className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2">
                <span className="w-4 text-orange-500 font-bold text-[11px]">02</span>
                <span>넥슨 API 연동 및 갱신 규칙</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a href="#section-3" className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2">
                <span className="w-4 text-orange-500 font-bold text-[11px]">03</span>
                <span>자주 묻는 질문 (FAQ)</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a href="#section-4" className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2">
                <span className="w-4 text-orange-500 font-bold text-[11px]">04</span>
                <span>100% 로컬 보안 원칙</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </nav>

        {/* ================= 섹션 1: 메케줄 소개 및 7대 핵심 기능 ================= */}
        <section id="section-1" className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-bold text-xs">01</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              메케줄 소개 및 7대 핵심 기능
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>메케줄(MapleSchedule)</strong>은 넥슨(NEXON) 공식 Open API를 연동하여 일일 퀘스트, 일일 보스, 주간 보스, 에픽 던전, 몬스터파크 등의 숙제 완료 여부를 한눈에 기록하고 관리하는 메이플스토리 전용 스마트 스케줄러입니다.
          </p>

          {/* 7대 핵심 기능 카드 그리드 (통일된 카드 디자인 시스템) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            
            {/* 1. 인게임 자동 동기화 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">인게임 자동 동기화</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  Open API
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                게임 내 '메이플 스케줄러' 설정과 오늘/이번 주의 보스 처치 현황을 API를 통해 원클릭으로 0초 만에 완벽 동기화합니다.
              </p>
            </div>

            {/* 2. 다계정 지원 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">다계정 (Multi-Account)</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  복수 API 키
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                여러 넥슨 계정(본계정, 부계정 등)의 API 키를 다중 등록하고 별칭을 부여하여 계정별 캐릭터를 독립 필터링 및 관리합니다.
              </p>
            </div>

            {/* 3. 계정 컨텐츠 통합 관리 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">계정 컨텐츠 통합 관리</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  몬파 · 에픽던전
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                몬스터파크(기본 2회)와 에픽 던전처럼 월드 단위로 공유되는 숙제를 특정 캐릭터에 구애받지 않고 계정 단위로 통합 관리합니다.
              </p>
            </div>

            {/* 4. 나만의 커스텀 숙제 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">커스텀 숙제 관리</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  자유 리셋 주기
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                유니온 코인 수령, 시드링 교체 등 인게임 외 나만의 숙제를 일일/목요일/일요일/월간 주기로 자유롭게 등록해 관리합니다.
              </p>
            </div>

            {/* 5. 초기화 임박 알림이 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">알림이 (리셋 임박 알림)</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  숙제 유실 방지
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                자정 또는 목요일 리셋 전 미완료 숙제가 남은 캐릭터 카드에 붉은 펄스 효과와 알림 팝업으로 깜빡 잊는 것을 방지합니다.
              </p>
            </div>

            {/* 6. 검은 마법사 & 커스텀 완료기준 추가/해제 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">완료 기준 커스텀 설정</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  완료율 조절
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                캐릭터 완료 도장(초록 체크) 판정 시 검은 마법사나 커스텀 숙제를 포함/제외할지 설정에서 자유롭게 토글합니다.
              </p>
            </div>

            {/* 7. 데이터 백업 & 원클릭 복원 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">데이터 백업 & 원클릭 복원</h3>
                </div>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-900/40">
                  100% 로컬 저장
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                중앙 서버 없는 100% 로컬 아키텍처로, [데이터 백업/내보내기] JSON 파일 저장과 [복원/가져오기]를 통해 언제든 1초 만에 그대로 원상 복구할 수 있습니다.
              </p>
            </div>

          </div>
        </section>

        {/* ================= 섹션 2: 넥슨 API 연동 ================= */}
        <section id="section-2" className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-bold text-xs">02</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              NEXON Open API 연동 방법 및 데이터 갱신 규칙
            </h2>
          </div>
          
          {/* API 발급 3단계 카드 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-500" />
              <span>API 키 발급 간단 3단계</span>
            </h3>
            <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <li>
                <a 
                  href="https://openapi.nexon.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-orange-600 dark:text-orange-400 font-semibold underline inline-flex items-center gap-1"
                >
                  NEXON Open API 센터 (openapi.nexon.com) <ExternalLink className="w-3 h-3" />
                </a>에 접속하여 넥슨 계정으로 로그인합니다.
              </li>
              <li>[내 애플리케이션] 메뉴에서 새 애플리케이션을 생성하고, 메이플스토리 게임 API 권한을 활성화합니다.</li>
              <li>발급된 API Key를 복사하여 메케줄 상단의 <strong>[API]</strong> 버튼을 누른 뒤 등록하시면 즉시 연동됩니다.</li>
            </ol>
          </div>

          {/* 3가지 동작 규칙 */}
          <div className="space-y-2.5 pt-1">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              💡 데이터 갱신
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>인게임 최신 데이터 반영 주기 & 즉시 반영 팁</span>
                </div>
                <div className="pl-6 text-xs text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                  <p>• 게임에서 보스를 잡거나 퀘스트를 완료하면 기본적으로 <strong>약 5~10분 후</strong>에 메케줄로 자동 반영됩니다.</p>
                  <p className="text-orange-600 dark:text-orange-400 font-semibold">
                    • 기다리기 번거로우시다면, 인게임에서 <strong>[채널 이동]</strong>, <strong>[캐시샵 이동]</strong> 또는 <strong>[접속 종료(로그아웃)]</strong>를 하시면 메케줄에서 바로 최신 클리어 상태를 가져올 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>신규 등록 전 1회 이상 게임 접속 권장</span>
                </div>
                <div className="pl-6 text-xs text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                  <p>• 캐릭터 등록 시 해당 캐릭터 당일 1회 이상 접속 시 올바른 데이터를 잘 불러올 수 있습니다.</p>
                  <p>• 등록 당일 미접속 시 '인게임 스케줄러 불러오기', '등록 전 날 처치한 보스', '등록 전 날 클리어한 퀘스트'를 정상적으로 불러오지 못 할수 있습니다.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>몬스터파크: 마지막 접속 캐릭터 월드 기록 & 2회 이상 클리어</span>
                </div>
                <div className="pl-6 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                  <p>• 몬스터파크는 계정 공통 숙제이며, 마지막으로 접속 한 캐릭터의 월드 내 기록을 통해 완료 여부를 판정합니다.</p>
                  <p>• 따라서 오늘 몬스터파크를 클리어한 캐릭터 또는 동일한 월드의 캐릭터가 메케줄에 등록되어있고, 당일 1회 이상 접속 시 자동으로 완료 표시가 적용됩니다.</p>
                  <p className="text-orange-600 dark:text-orange-400 font-semibold">• 몬스터파크 완료 기준은 2회 이상 클리어 입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 섹션 3: 자주 묻는 질문 FAQ ================= */}
        <section id="section-3" className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-bold text-xs">03</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              자주 묻는 질문 (FAQ)
            </h2>
          </div>

          <div className="space-y-2.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-orange-500 font-bold">Q.</span>
                <span>새로 추가한 캐릭터의 보스 처치 이력이나 스케줄러가 불러와지지 않아요.</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                A. 생성 후 <strong>게임에 한 번도 접속하지 않았거나 장기간 미접속 상태인 캐릭터</strong>는 넥슨 API 서버에 데이터가 색인되어 있지 않습니다. 메이플 게임에 해당 캐릭터로 1회 접속 후 채널 이동 또는 정상 로그아웃을 진행하시면 넥슨 서버에 등록되어 메케줄에서 정상적으로 불러올 수 있습니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-orange-500 font-bold">Q.</span>
                <span>게임에서 보스를 잡았는데 메케줄에 바로 체크가 안 돼요.</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                A. 넥슨 API 기본 갱신 주기는 통상 <strong>5~10분</strong>입니다. 기다리지 않고 즉시 체크하고 싶으시다면 인게임에서 <strong>[채널 이동]</strong> 또는 <strong>[캐시샵 이동]</strong>을 하신 뒤 메케줄에서 새로고침(⟳)을 누르시면 0초 만에 즉시 체크됩니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-orange-500 font-bold">Q.</span>
                <span>몬스터파크를 클리어했는데 왜 메케줄에 안 뜨나요?</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                A. 몬스터파크는 마지막으로 접속한 캐릭터의 월드 내 기록을 통해 완료 여부를 판정합니다. 오늘 몬스터파크를 클리어한 캐릭터 또는 동일한 월드의 캐릭터가 메케줄에 등록되어 있고 당일 1회 이상 접속(채널 이동/로그아웃)해야 하며, 2회 이상 클리어해야 완료 처리됩니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-orange-500 font-bold">Q.</span>
                <span>캐릭터 닉네임을 변경하거나 서버 이전(월드리프)을 했습니다.</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                A. 메케줄에는 <strong>자가 치유(Self-Healing) 시스템</strong>이 탑재되어 있습니다. 새로고침 시 변경된 닉네임과 새로운 OCID 식별자를 자동으로 감지하여 기존의 보스 및 일일 숙제 완료 기록을 100% 안전하게 보존합니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-orange-500 font-bold">Q.</span>
                <span>다른 PC나 모바일 기기로 내 캐릭터 체크 기록을 옮길 수 있나요?</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                A. 네! 상단 설정(톱니바퀴) 아이콘을 눌러 <strong>[데이터 백업/내보내기]</strong>를 누르면 JSON 파일로 안전하게 저장되며, 새 기기에서 <strong>[데이터 복원/가져오기]</strong>를 누르면 1초 만에 그대로 복원됩니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="text-orange-500 font-bold">Q.</span>
                <span>브라우저 캐시 삭제 시 데이터가 날아가나요?</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                A. 메케줄은 보안을 위해 중앙 DB 없이 이용자 본인의 브라우저(LocalStorage)에만 안전하게 데이터를 보관하므로, 브라우저 '인터넷 사용 기록 삭제' 시 초기화될 수 있습니다. 정기적으로 [데이터 백업/내보내기]를 해두시면 언제든 안전하게 복구할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* ================= 섹션 4: 보안 및 개인정보 ================= */}
        <section id="section-4" className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-bold text-xs">04</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              100% 안전한 보안 및 개인정보 비수집 원칙
            </h2>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>No-Server 완벽 로컬 아키텍처</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              메케줄은 <strong>개발자의 외부 중앙 서버로 어떠한 회원 정보, 캐릭터 정보 또는 API 키도 수집 및 전송하지 않습니다.</strong> 입력하신 모든 데이터는 이용자 본인의 브라우저 로컬 저장소에만 보관되며, 넥슨 공식 서버(open.api.nexon.com)와 브라우저 간 직접 HTTPS 통신만 이루어집니다. 계정 비밀번호나 개인정보는 일체 요구되지 않으므로 안심하고 이용하셔도 좋습니다.
            </p>
          </div>
        </section>

        {/* 하단 애드센스 광고 영역 */}
        <div className="my-6">
          <AdSenseBanner />
        </div>

        {/* 하단 푸터 네비게이션 */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div>
            <span>Data based on NEXON Open API | MapleStory © NEXON Korea Corp.</span>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/terms" 
              className="hover:text-slate-700 dark:hover:text-slate-200 underline transition-colors"
            >
              서비스 이용약관
            </a>
            <span>·</span>
            <a 
              href="/privacy" 
              className="hover:text-slate-700 dark:hover:text-slate-200 underline transition-colors"
            >
              개인정보처리방침
            </a>
            <span>·</span>
            <a 
              href="/" 
              onClick={navigateToHome}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
            >
              스케줄러 홈으로 이동
            </a>
          </div>
        </div>

      </main>
    </div>
  );
};
