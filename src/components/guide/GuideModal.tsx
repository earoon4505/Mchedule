import React from 'react';
import { 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Key, 
  HelpCircle, 
  CheckCircle2, 
  Calendar, 
  RefreshCw, 
  ExternalLink,
  Users,
  Package,
  Plus
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegal?: (tab: 'terms' | 'privacy') => void;
}

/**
 * 메케줄(MapleSchedule) 가이드 모달
 * 
 * [통일된 디자인 시스템]
 * 1. 제목: '메케줄 가이드'로 간결화
 * 2. 일관된 카드 규격과 타이포그래피 (오렌지 포인트 + 차분한 슬레이트 톤)
 * 3. 스크롤 및 닫기 기능 완벽 보존
 */
export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onOpenLegal,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="guide-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="guide-modal"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                메케줄 가이드
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                핵심 기능 및 넥슨 Open API 연동 안내
              </p>
            </div>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain p-5 sm:p-6 space-y-6 custom-scrollbar text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* 섹션 1: 메케줄 소개 및 7대 핵심 기능 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold text-[10px]">01</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                메케줄 소개 및 7대 핵심 기능
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>메케줄(MapleSchedule)</strong>은 넥슨 Open API를 기반으로 메이플스토리 일일 퀘스트, 일일/주간 보스, 에픽 던전, 몬스터파크 등의 숙제 완료 여부를 한눈에 기록하고 관리하는 스마트 스케줄러입니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              
              {/* 1. 인게임 자동 동기화 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">인게임 자동 동기화</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">Open API</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  게임 내 '메이플 스케줄러' 설정과 오늘/이번 주의 보스 처치 현황을 API를 통해 원클릭으로 그대로 가져옵니다.
                </div>
              </div>

              {/* 2. 다계정 지원 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">다계정 (Multi-Account)</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">복수 API 키</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  여러 넥슨 계정의 API 키를 다중 등록하고 별칭을 부여하여 계정별 캐릭터를 독립 필터링 및 관리합니다.
                </div>
              </div>

              {/* 3. 계정 컨텐츠 통합 관리 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">계정 컨텐츠 통합 관리</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">몬파 · 에픽던전</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  몬스터파크(기본 2회)와 에픽 던전처럼 월드 단위로 공유되는 숙제를 계정 단위로 묶어 한 화면에서 관리합니다.
                </div>
              </div>

              {/* 4. 나만의 커스텀 숙제 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">커스텀 숙제 관리</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">자유 리셋 주기</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  유니온 코인 수령, 시드링 교체 등 개인 맞춤 숙제를 일일/목요일/일요일/월간 주기로 자유롭게 등록합니다.
                </div>
              </div>

              {/* 5. 초기화 임박 알림이 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">알림이 (리셋 임박 알림)</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">숙제 유실 방지</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  자정 또는 목요일 리셋 전 미완료 숙제가 남은 캐릭터 카드에 붉은 펄스 효과와 알림으로 깜빡 잊는 것을 방지합니다.
                </div>
              </div>

              {/* 6. 검마/커스텀 완료기준 설정 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">완료 기준 설정</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">완료율 조절</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  캐릭터 완료 도장(초록 체크) 판정 시 검은 마법사나 커스텀 숙제를 포함/제외할지 설정에서 자유롭게 토글합니다.
                </div>
              </div>

              {/* 7. 데이터 백업 & 복원 */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">데이터 백업 & 원클릭 복원</span>
                  </div>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/40">100% 로컬 저장</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  중앙 서버 없는 100% 로컬 아키텍처로, [데이터 백업/내보내기] JSON 파일 저장과 [복원/가져오기]를 지원합니다.
                </div>
              </div>

            </div>
          </section>

          {/* 섹션 2: 넥슨 Open API 연동 안내 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold text-[10px]">02</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                NEXON Open API 연동 방법 및 데이터 갱신 규칙
              </h4>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-orange-500" />
                <span>API 키 발급 간단 3단계</span>
              </div>
              <ol className="list-decimal pl-4 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <li><a href="https://openapi.nexon.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 underline font-semibold inline-flex items-center gap-0.5">NEXON Open API 센터 <ExternalLink className="w-2.5 h-2.5" /></a> 접속 및 로그인</li>
                <li>[내 애플리케이션] 등록 후 메이플스토리 게임 API 권한 활성화</li>
                <li>발급된 API Key 복사 후 메케줄 상단 [API] 버튼에 등록</li>
              </ol>
            </div>

            <div className="font-bold text-xs text-slate-900 dark:text-white pt-1">
              💡 데이터 갱신
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>인게임 최신 데이터 반영 주기</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5 leading-relaxed">
                  보스나 퀘스트 완료 후 통상 5~10분 후 메케줄로 자동 반영됩니다. 바로 반영하려면 인게임에서 <strong>[채널 이동]</strong>, <strong>[캐시샵 이동]</strong> 또는 <strong>[접속 종료]</strong>를 진행하세요.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>신규 등록 전 1회 이상 게임 접속 권장</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-5 space-y-0.5 leading-relaxed">
                  <p>• 캐릭터 등록 시 해당 캐릭터 당일 1회 이상 접속 시 올바른 데이터를 잘 불러올 수 있습니다.</p>
                  <p>• 등록 당일 미접속 시 '인게임 스케줄러 불러오기', '등록 전 날 처치한 보스', '등록 전 날 클리어한 퀘스트'를 정상적으로 불러오지 못 할수 있습니다.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>몬스터파크: 마지막 접속 캐릭터 월드 기록 & 2회 이상 클리어</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 pl-5 space-y-0.5 leading-relaxed">
                  <p>• 몬스터파크는 계정 공통 숙제이며, 마지막으로 접속 한 캐릭터의 월드 내 기록을 통해 완료 여부를 판정합니다.</p>
                  <p>• 따라서 오늘 몬스터파크를 클리어한 캐릭터 또는 동일한 월드의 캐릭터가 메케줄에 등록되어있고, 당일 1회 이상 접속 시 자동으로 완료 표시가 적용됩니다.</p>
                  <p className="text-orange-600 dark:text-orange-400 font-semibold">• 몬스터파크 완료 기준은 2회 이상 클리어 입니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 3: 자주 묻는 질문 FAQ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold text-[10px]">03</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                자주 묻는 질문 (FAQ)
              </h4>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Q. 새로 추가한 캐릭터의 정보가 안 불러와져요.</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  A. 신규/장기미접속 캐릭터는 넥슨 서버에 데이터가 없습니다. 게임에 1회 접속 후 채널이동이나 종료를 진행하시면 정상 등록됩니다.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Q. 게임에서 보스를 잡았는데 바로 체크가 안 돼요.</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  A. 넥슨 API 반영에 5~10분이 걸립니다. 인게임에서 [채널 이동] 또는 [캐시샵 이동]을 하신 뒤 새로고침하시면 즉시 반영됩니다.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Q. 브라우저 캐시 삭제 시 데이터가 날아가나요?</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  A. 중앙 서버 없이 로컬에만 저장되므로, 브라우저 청소 전 상단 설정의 <strong>[데이터 백업/내보내기]</strong>를 통해 파일로 백업해두시면 언제든 복원할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          {/* 섹션 4: 로컬 보안 원칙 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
              <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white font-bold text-[10px]">04</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                100% 안전한 보안 원칙
              </h4>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>No-Server 완벽 로컬 아키텍처</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                메케줄은 외부 서버로 어떠한 회원 정보, 캐릭터 정보 또는 API 키도 수집 및 전송하지 않으며, 이용자 본인의 로컬 저장소에만 보관됩니다.
              </p>
            </div>
          </section>

        </div>

        {/* 하단 푸터 바 */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => onOpenLegal?.('terms')}
              className="hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
            >
              이용약관
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onOpenLegal?.('privacy')}
              className="hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
            >
              개인정보처리방침
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
