import React, { useEffect } from 'react';
import { Megaphone, Check } from 'lucide-react';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 공지사항 팝업 모달
 * - API 버튼 왼쪽 확성기 아이콘 클릭 시 표시되는 공지사항 팝업
 * - 넥슨 Open API 데이터 제한 사항 및 월드리프/닉네임 변경 시 안내 제공
 */
export const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose }) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="notice-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="notice-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더: 제목 '공지사항' (부가설명 및 X 버튼 제거) */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">공지사항</h2>
          </div>
        </div>

        {/* 공지 내용 본문 */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {/* 1번 공지사항 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium leading-relaxed">
              <div>
                <span className="font-bold text-blue-600 dark:text-blue-400">일일 보스</span>, <span className="font-bold text-[#8B0000] dark:text-[#f87171]">검은 마법사</span>의 데이터가 갱신되지 않고 있습니다.
              </div>
              <div className="mt-1">
                <span className="font-bold text-blue-600 dark:text-blue-400">일일 보스</span>, <span className="font-bold text-[#8B0000] dark:text-[#f87171]">검은 마법사</span> 스케줄러는 이용 불가합니다.
              </div>
            </div>
          </div>

          {/* 2번 공지사항 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium leading-relaxed">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">닉네임 변경</span>, <span className="font-bold text-slate-900 dark:text-white">월드 리프</span>를 동시에 진행할 경우 중간에 <span className="font-bold text-orange-600 dark:text-orange-400">새로고침</span>을 해주시기 바랍니다.
              </div>
              <div className="mt-1">
                (<span className="font-bold text-orange-600 dark:text-orange-400">새로고침</span>을 하지 않았다면 캐릭터 삭제 후 재등록해 주시기 바랍니다.)
              </div>
            </div>
          </div>

          {/* 3번 공지사항 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white">월드 리프</span> 이전 기록들은 <span className="font-bold text-slate-900 dark:text-white">월드 리프</span> 이후 갱신되지 않습니다.
            </div>
          </div>
        </div>

        {/* 하단 확인 버튼 */}
        <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            id="btn-confirm-notice"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Check className="w-4 h-4" />
            <span>확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};
