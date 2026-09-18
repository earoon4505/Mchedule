import React, { useEffect, useRef } from 'react';
import { isWeb } from '../../utils/platform';

interface AdSenseBannerProps {
  /** 
   * 향후 실제 구글 애드센스 디스플레이 광고 단위의 슬롯 ID (예: '1234567890') 
   */
  slotId?: string;
  /** 클라이언트 ID (기본값: ca-pub-9376850026832369) */
  clientId?: string;
}

/**
 * 구글 애드센스 가로형 디스플레이 광고 슬롯 컴포넌트
 * 
 * [핵심 규칙]
 * 1. 데스크톱(Electron) 환경에서는 정책 준수 및 UI 보존을 위해 렌더링되지 않으며(return null), 
 *    오직 '웹 브라우저' 환경에서만 활성화됩니다.
 * 2. 애드센스 승인 완료 후 발급된 slotId를 전달하거나 자동 광고가 실행되면 즉시 광고가 송출됩니다.
 */
export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotId,
  clientId = 'ca-pub-9376850026832369',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);

  // 1. 웹 브라우저 환경이 아니면(데스크톱 Electron) 절대 렌더링하지 않음
  if (!isWeb) {
    return null;
  }

  // 2. 실제 slotId가 전달된 경우 애드센스 푸시 실행
  useEffect(() => {
    if (slotId && isWeb) {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        console.warn('[AdSense] 광고 로드 중 오류 발생:', err);
      }
    }
  }, [slotId]);

  return (
    <div 
      id="adsense-banner-container" 
      className="w-full max-w-[728px] h-[90px] mx-auto flex items-center justify-center select-none"
    >
      {/* 구글 애드센스 가로형 디스플레이 광고 슬롯 (728 × 90) */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '100%', height: '90px' }}
        data-ad-client={clientId}
        {...(slotId ? { 'data-ad-slot': slotId } : {})}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
};

