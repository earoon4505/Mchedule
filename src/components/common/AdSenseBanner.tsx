import React, { useEffect, useRef } from 'react';
import { isWeb } from '../../utils/platform';
import { Megaphone, ExternalLink } from 'lucide-react';

interface AdSenseBannerProps {
  /**
   * 구글 애드센스에서 생성한 디스플레이 광고 단위의 슬롯 ID (예: "1234567890")
   * 아직 슬롯 ID를 발급받기 전이거나 테스트 중일 때는 비워두면 파란색 임시 안내 배너가 표시됩니다.
   */
  slotId?: string;
  /**
   * 애드센스 퍼블리셔 클라이언트 ID
   */
  clientId?: string;
  /**
   * 테스트 모드 강제 표시 여부 (기본값: slotId가 없으면 true)
   */
  isPlaceholder?: boolean;
}

/**
 * 메인 화면 중앙 하단 전용 구글 애드센스 가로형 반응형 배너 컴포넌트
 * 
 * [핵심 규칙]
 * 1. 데스크톱(Electron) 환경에서는 애드센스 정책 보호를 위해 전혀 렌더링되지 않습니다 (!isWeb -> null).
 * 2. 웹(Web) 환경에서만 작동하며, 스케줄 목록과 분리된 독립된 하단 칸에 안정적으로 배치됩니다.
 * 3. 추후 구글 애드센스 승인 후 생성한 디스플레이 광고의 data-ad-slot 값(예: slotId="1234567890")만
 *    넣어주면 바로 실제 구글 디스플레이 광고가 노출됩니다.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotId = '',
  clientId = 'ca-pub-9376850026832369',
  isPlaceholder,
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const isLoadedRef = useRef(false);

  // 1. 데스크톱(Electron) 환경에서는 애드센스 정책 보호를 위해 표시하지 않음
  if (!isWeb) {
    return null;
  }

  // 슬롯 ID가 없거나 placeholder 플래그가 켜져 있으면 테스트용 임시 파란색 배너 표시
  const showPlaceholder = isPlaceholder !== undefined ? isPlaceholder : !slotId;

  useEffect(() => {
    if (!showPlaceholder && slotId && !isLoadedRef.current) {
      try {
        // @ts-expect-error window.adsbygoogle
        const adsbygoogle = window.adsbygoogle || [];
        adsbygoogle.push({});
        isLoadedRef.current = true;
      } catch (err) {
        console.warn('AdSense 광고 로드 에러:', err);
      }
    }
  }, [showPlaceholder, slotId]);

  return (
    <div
      id="main-adsense-banner-container"
      className="w-full flex-shrink-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs px-4 py-2 flex items-center justify-center select-none"
    >
      <div className="w-full max-w-4xl flex items-center justify-center">
        {showPlaceholder ? (
          // =========================================================================
          // [테스트 임시 표시 구역] - 사용자가 쉽게 알아볼 수 있도록 파란색으로 표시
          // 추후 실제 slotId가 주어지면 자동으로 실제 구글 디스플레이 광고로 전환됩니다.
          // =========================================================================
          <div
            id="adsense-test-placeholder"
            className="w-full min-h-[80px] sm:min-h-[90px] rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-500/80 bg-blue-50/90 dark:bg-blue-950/40 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    구글 애드센스 광고 영역
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-200/80 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200">
                    웹 전용
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    테스트 임시 표시 (파란색)
                  </span>
                </div>
                <p className="text-[11px] text-blue-600/90 dark:text-blue-400 mt-0.5 leading-tight">
                  디스플레이 광고(가로 반응형)가 들어갈 독립된 하단 칸입니다. 스케줄 목록과 분리되어 있어 레이아웃이 겹치거나 깨지지 않습니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/80 flex-shrink-0">
              <span className="font-medium">
                👉 승인 후 slotId 입력 시 실제 광고로 즉시 전환
              </span>
            </div>
          </div>
        ) : (
          // =========================================================================
          // [실제 구글 디스플레이 광고 구역]
          // =========================================================================
          <div className="w-full min-h-[90px] flex items-center justify-center overflow-hidden">
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '90px' }}
              data-ad-client={clientId}
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSenseBanner;
