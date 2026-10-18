import React from 'react';
import { ArrowUpCircle, Sparkles, X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  version: string;
  onClose: () => void;
  onUpdate: () => void;
}

/**
 * 메케줄 데스크톱 자동 업데이트 안내 모달
 * 
 * [요구사항 반영]
 * - 멘트:
 *   "메케줄 (v {version}) 업데이트가 준비되었습니다.
 *    지금 바로 업데이트를 진행하시겠습니까?"
 * - 버튼: [나중에 하기] / [업데이트]
 * - 사용자가 [업데이트]를 직접 클릭해야만 즉시 재실행 및 패치 설치 진행
 */
export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  version,
  onClose,
  onUpdate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="update-modal-backdrop"
      className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        id="update-modal"
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>새로운 버전 준비 완료</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              메케줄 (v {version}) 업데이트가 준비되었습니다.
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-0.5">
              지금 바로 업데이트를 진행하시겠습니까?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            나중에 하기
          </button>
          <button
            id="btn-confirm-app-update"
            type="button"
            onClick={onUpdate}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>업데이트</span>
          </button>
        </div>
      </div>
    </div>
  );
};
