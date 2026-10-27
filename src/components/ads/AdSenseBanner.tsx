import React, { useEffect, useRef } from 'react';
import { isWeb } from '../../utils/platform';

interface AdSenseBannerProps {
  /** 
   * 향후 실제 구글 애드센스 디스플레이 광고 단위의 슬롯 ID (예: '1234567890') 
   */
  slotId?: string;
  /** 클라이언트 ID (기본값: ca-pub-9376850026832369) */
  clientId?: string;
  /** 
   * 콘텐츠 유무 안전 가드:
   * 캐릭터가 없거나 빈 화면일 때 광고가 노출되어 "콘텐츠가 없는 화면에 광고 게재" 정책 위반이 되는 것을 완벽 차단.
   * false일 경우 절대 광고를 렌더링하지 않습니다.
   */
  hasContent?: boolean;
}

/**
 * 구글 애드센스 가로형 디스플레이 광고 슬롯 컴포넌트
 * 
 * [핵심 정책 준수 가드]
 * 1. 데스크톱(Electron) 환경에서는 UI 보존 및 정책 준수를 위해 절대 렌더링되지 않음(return null).
 * 2. 웹 환경에서도 캐릭터가 0명이거나 빈 화면일 때(hasContent === false)는 광고를 절대 송출하지 않아
 *    구글 애드센스 "게시자 콘텐츠가 없는 화면에 Google 게재 광고" 위반을 100% 방지합니다.
 * 3. 5,000자 이상의 풍부한 가이드 문서(/guide) 및 실제 일일/주간 숙제가 활성화된 화면에서만 안전하게 노출됩니다.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotId,
  clientId = 'ca-pub-9376850026832369',
  hasContent = true,
}) => {
  const adRef = useRef<HTMLModElement | null>(null);

  // 1. 웹 브라우저 환경이 아니면(데스크톱 Electron) 절대 렌더링하지 않음
  if (!isWeb) {
    return null;
  }

  // 2. [애드센스 정책 가드] 화면에 실질적인 콘텐츠가 없으면 광고를 일체 게재하지 않음
  if (!hasContent) {
    return null;
  }

  // 3. 실제 slotId가 전달된 경우 애드센스 푸시 실행
  useEffect(() => {
    if (slotId && isWeb && hasContent) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.warn('[AdSense] 광고 로드 중 오류 발생:', err);
      }
    }
  }, [slotId, hasContent]);

  return (
    <div 
      id="adsense-banner-container" 
      className="w-full max-w-[728px] min-h-[90px] mx-auto flex items-center justify-center select-none my-2"
    >
      {/* 구글 애드센스 가로형 디스플레이 광고 슬롯 (728 × 90) */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '100%', minHeight: '90px' }}
        data-ad-client={clientId}
        {...(slotId ? { 'data-ad-slot': slotId } : {})}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
};
