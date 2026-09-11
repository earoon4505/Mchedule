import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Mail, 
  Scale, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

export type LegalTab = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 탭 변경 시 확장 섹션 리셋
  const handleSwitchTab = (tab: LegalTab) => {
    setActiveTab(tab);
    setExpandedSection(null);
  };

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  if (!isOpen) return null;

  return (
    <div 
      id="legal-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="legal-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                운영 정책 및 법적 고지
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                메케줄(MapleSchedule) 서비스 이용약관 및 개인정보처리방침
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 상단 탭 스위처 */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 gap-1">
            <button
              type="button"
              onClick={() => handleSwitchTab('terms')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>서비스 이용약관</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('privacy')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>개인정보처리방침</span>
            </button>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar text-xs leading-relaxed">
          {activeTab === 'terms' ? (
            /* ================= 이용약관 전문 (공정위 표준약관 기반) ================= */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                  💡 안내사항
                </p>
                <p className="text-[11.5px] leading-normal">
                  본 약관은 공정거래위원회 표준약관 및 넥슨 Open API 이용정책을 준수하여 작성되었습니다. 
                  메케줄은 메이플스토리 유저들을 위한 100% 무료 비영리 유틸리티입니다.
                </p>
              </div>

              {/* 제1조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제1조</span>
                  <span>목적</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  본 약관은 "메케줄(MapleSchedule)"(이하 "서비스")을 제공하는 운영자와 서비스를 이용하는 이용자 간에 서비스의 이용 조건, 절차 및 권리·의무, 책임사항 등 제반 사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              {/* 제2조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제2조</span>
                  <span>용어의 정의</span>
                </h4>
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <li><strong>"서비스"</strong>란 운영자가 제작하여 웹 브라우저 및 Windows 데스크톱 애플리케이션 형태로 제공하는 메이플스토리 스케줄 관리 및 통계 유틸리티를 의미합니다.</li>
                  <li><strong>"이용자"</strong>란 본 약관에 따라 서비스를 이용하는 모든 자를 의미합니다.</li>
                  <li><strong>"NEXON Open API"</strong>란 (주)넥슨코리아가 공식 제공하는 메이플스토리 게임 데이터 조회용 애플리케이션 프로그래밍 인터페이스를 말합니다.</li>
                  <li><strong>"API Key"</strong>란 넥슨 Open API 센터에서 이용자가 직접 발급받아 서비스에 등록하는 인증 식별값을 말합니다.</li>
                </ul>
              </div>

              {/* 제3조 - 약관의 효력 및 개정 (사용자 요청 핵심 권한) */}
              <div className="border border-orange-200/80 dark:border-orange-900/40 rounded-xl p-4 bg-orange-50/20 dark:bg-orange-950/10 space-y-1.5">
                <h4 className="font-bold text-orange-900 dark:text-orange-300 text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/60 text-[10px] text-orange-700 dark:text-orange-300 font-bold">제3조</span>
                  <span>약관의 게시 및 개정 권한</span>
                </h4>
                <div className="text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <p>① 본 약관은 서비스 화면 및 설정 메뉴 등에 상시 게시함으로써 효력이 발생합니다.</p>
                  <p>② 운영자는 「약관의 규제에 관한 법률」 등 관계 법령과 넥슨의 운영정책을 위배하지 않는 범위 내에서 <strong>본 약관을 개정할 수 있는 권리</strong>를 가집니다.</p>
                  <p>③ 운영자가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 서비스 내에 적용일 최소 7일 전부터 공지합니다. 단, 이용자에게 불리하거나 중대한 사항의 변경은 30일 전부터 공지합니다.</p>
                  <p>④ 이용자가 변경된 약관의 적용일까지 명시적인 거부 의사를 표시하지 아니하고 서비스를 계속 이용하는 경우, 개정된 약관에 동의한 것으로 봅니다.</p>
                </div>
              </div>

              {/* 제4조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제4조</span>
                  <span>서비스의 성격 및 무료 제공</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  본 서비스는 메이플스토리 이용자들의 편의를 도모하기 위해 제작된 <strong>순수 비영리 팬메이드(Fan-made) 유틸리티</strong>이며, 일체의 유료 구독, 결제, 강제 과금 없이 <strong>전면 100% 무료</strong>로 제공됩니다.
                </p>
              </div>

              {/* 제5조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제5조</span>
                  <span>지식재산권의 귀속 및 비공식 서비스 고지</span>
                </h4>
                <div className="text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <p>① <strong>MapleStory 및 게임과 관련된 일체의 상표, 로고, 캐릭터 아바타 이미지, 퀘스트/보스 명칭 및 인게임 데이터에 대한 저작권과 지식재산권은 (주)넥슨코리아에 전적으로 귀속</strong>됩니다.</p>
                  <p>② 본 서비스에서 사용되는 메이플스토리 관련 데이터는 넥슨 Open API 이용정책을 준수하여 호출 및 표시됩니다 (<code>Data based on NEXON Open API</code>).</p>
                  <p>③ <strong>본 서비스는 넥슨의 공식 서비스가 아니며, (주)넥슨코리아와 어떠한 제휴, 협력, 보증, 후원 관계도 존재하지 않습니다.</strong></p>
                  <p>④ 서비스 자체의 UI 디자인 및 소스 코드에 대한 저작권은 운영자에게 있으며, 오픈소스 MIT 라이선스의 범위를 따릅니다.</p>
                </div>
              </div>

              {/* 제6조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제6조</span>
                  <span>서비스의 내용 및 변경</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  서비스는 메이플스토리 일일·주간·보스 콘텐츠 완료 여부 저장, 진행률 통계, 인게임 스케줄러 동기화, 미니 오버레이(PiP) 기능을 제공합니다. 운영자는 넥슨 게임 패치, Open API 규격 변경, 기술적 개선에 따라 기능의 전부 또는 일부를 수정·변경할 수 있습니다.
                </p>
              </div>

              {/* 제7조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제7조</span>
                  <span>이용자의 의무 및 금지행위</span>
                </h4>
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <li>이용자가 입력한 API Key는 본인의 책임 하에 관리되어야 하며 타인에게 양도하거나 대여할 수 없습니다.</li>
                  <li>이용자는 넥슨 Open API 서버 또는 본 서비스에 비정상적인 대량 호출(DDoS, 악의적 트래픽)을 유발하여서는 안 됩니다.</li>
                  <li>프로그램을 악의적으로 변조하거나 불법적인 용도로 재배포하는 행위를 하여서는 안 됩니다.</li>
                </ul>
              </div>

              {/* 제8조 - 면책 조항 (개발자 보호) */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-bold">제8조</span>
                  <span>면책 조항 (책임의 한계)</span>
                </h4>
                <div className="text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <p>① <strong>본 서비스는 어떠한 명시적·묵시적 보증도 없이 '있는 그대로(AS-IS)' 제공됩니다.</strong></p>
                  <p>② 운영자는 다음 각 호의 사유로 인해 이용자에게 발생한 손해에 대하여 법적 책임을 지지 아니합니다:
                    <br />- 넥슨 Open API 서버의 점검, 장애, 지연, 데이터 불일치로 인한 동기화 오류
                    <br />- 이용자 본인의 단말기 환경 오류, 브라우저 캐시 삭제, 조작 미숙으로 인한 데이터 유실
                    <br />- 서비스 이용 또는 일시적 오류로 인하여 발생한 인게임 보상 미수령, 시간 손실 등 간접적·부수적 손해
                  </p>
                  <p>③ 무료로 제공되는 비영리 서비스의 특성상, 관련 법령에 고의 또는 중대한 과실이 없는 한 운영자는 어떠한 손해배상 책임도 지지 않습니다.</p>
                </div>
              </div>

              {/* 제9조 및 제10조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제9조 및 제10조</span>
                  <span>서비스 중단, 준거법 및 공식 문의처</span>
                </h4>
                <div className="text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <p>• 운영자는 넥슨의 정책 변경, 천재지변, 개인 사정 등 불가피한 경우 서비스의 제공을 중단할 수 있습니다.</p>
                  <p>• 본 약관의 해석 및 서비스 이용과 관련된 분쟁에 대해서는 대한민국 법률을 적용합니다.</p>
                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">공식 문의: mchedule4505@gmail.com</span>
                    <span className="text-slate-400">시행일자: 2026년 9월 11일</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= 개인정보처리방침 전문 (정부 개인정보포털 privacy.go.kr 기준) ================= */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/30 text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>개인정보 비수집(No-Server) 원칙 안내</span>
                </p>
                <p className="text-[11.5px] leading-normal">
                  메케줄은 별도의 회원가입이나 중앙 서버 DB를 두지 않습니다. 이용자가 등록한 <strong>API Key 및 모든 스케줄 데이터는 전적으로 이용자 본인의 기기(브라우저 LocalStorage)에만 저장</strong>되며, 개발자의 외부 서버로 전송되지 않습니다.
                </p>
              </div>

              {/* 제1조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제1조</span>
                  <span>개인정보의 처리 목적</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  본 서비스는 1) 메이플스토리 인게임 콘텐츠 완료 여부 저장 및 통계 계산, 2) NEXON Open API를 통한 캐릭터 정보 및 스케줄러 상태 조회, 3) 화면 테마 및 알림 설정 유지를 위해서만 데이터를 처리하며 다른 목적으로는 이용되지 않습니다.
                </p>
              </div>

              {/* 제2조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제2조</span>
                  <span>처리하는 데이터 항목 및 수집 방식</span>
                </h4>
                <ul className="list-disc pl-4 text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <li><strong>로컬 처리 항목 (사용자 기기 내 저장)</strong>: NEXON Open API Key, 캐릭터 식별값(OCID), 캐릭터명, 월드명, 직업, 레벨, 아바타 주소, 스케줄 클리어 체크 기록, 커스텀 숙제, 설정값</li>
                  <li><strong>수집하지 않는 항목</strong>: 주민등록번호, 연락처, 넥슨 메이플스토리 계정 아이디 및 비밀번호 등 일체의 민감 개인정보는 요구하거나 수집하지 않습니다.</li>
                </ul>
              </div>

              {/* 제3조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제3조</span>
                  <span>개인정보의 처리 및 보유 기간</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  중앙 서버 DB가 존재하지 않으므로, 데이터의 보유 기간은 이용자의 이용 의사에 따릅니다. 사용자가 <strong>앱 내 [설정 → 데이터 초기화]</strong>를 누르거나 브라우저 캐시를 삭제하면 즉시 지체 없이 완전 영구 파기됩니다.
                </p>
              </div>

              {/* 제4조 및 제5조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제4조 및 제5조</span>
                  <span>제3자 제공 및 업무 위탁의 부존재</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  본 서비스는 어떠한 개인정보도 제3자에게 제공하거나 판매하지 않으며, 처리를 위탁하지 않습니다. 단, 캐릭터 조회를 위해 브라우저에서 넥슨 공식 서버(<code>open.api.nexon.com</code>)로 직접 HTTPS 통신 조회가 발생합니다.
                </p>
              </div>

              {/* 제6조 및 제7조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제6조 및 제7조</span>
                  <span>이용자의 권리 행사 및 파기 절차</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  이용자는 언제든 저장된 데이터의 수정 및 삭제를 요구할 수 있습니다. 설정 메뉴의 [데이터 초기화] 버튼을 통해 저장된 API Key와 모든 캐릭터 기록을 1초 만에 완전 파기할 수 있습니다.
                </p>
              </div>

              {/* 제8조 및 제9조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제8조 및 제9조</span>
                  <span>안전성 확보 조치 및 쿠키(Cookie) 미사용</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  외부 서버 비수집 아키텍처와 HTTPS 암호화 전송을 통해 데이터 유출을 원천 방어합니다. 또한 맞춤형 광고 트래커나 상업용 쿠키(Cookie)를 일절 운용하지 않습니다.
                </p>
              </div>

              {/* 제10조 및 제11조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제10조 및 제11조</span>
                  <span>개인정보 보호책임자 및 권익침해 구제안내</span>
                </h4>
                <div className="text-slate-600 dark:text-slate-400 text-[11.5px] space-y-1">
                  <p>• <strong>담당 및 공식 문의 이메일</strong>: <strong>mchedule4505@gmail.com</strong></p>
                  <p>• <strong>데이터 출처</strong>: Data based on NEXON Open API (MapleStory © NEXON Korea Corp.)</p>
                  <p className="text-[10.5px] text-slate-400 pt-1">
                    권익침해 구제기관: 개인정보분쟁조정위원회(1833-6972), 개인정보침해신고센터(118), 대검찰청 사이버수사과(1301), 경찰청 사이버수사국(182)
                  </p>
                </div>
              </div>

              {/* 제12조 */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900/50 space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">제12조</span>
                  <span>개인정보 처리방침의 변경</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11.5px]">
                  본 방침은 관계 법령, 넥슨 운영정책, 서비스 변경에 따라 개정될 수 있으며, 개정 시 서비스 공지를 통해 시행 일자와 변경 사유를 고지합니다.
                  <br /><strong>공고 및 시행일자: 2026년 9월 11일</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 모달 하단 푸터 */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between flex-shrink-0">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span>Data based on NEXON Open API</span>
            <span className="hidden sm:inline">|</span>
            <span>MapleStory © NEXON Korea Corp.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
