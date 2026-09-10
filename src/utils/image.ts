import type { SyntheticEvent } from 'react';
import { isWeb } from './platform';

/**
 * 캐릭터 아바타 이미지 URL 변환 헬퍼
 * 데스크톱(Electron) 환경에서는 로컬 프록시(/api/proxy/image)를 거쳐 안정적으로 표시하고,
 * 웹 브라우저(Vercel 등) 환경에서는 원본 CDN URL을 직접 반환합니다.
 */
export function getCharacterAvatarUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Base64 또는 로컬 경로는 그대로 반환
  if (trimmed.startsWith('data:') || trimmed.startsWith('/api/proxy')) {
    return trimmed;
  }

  // 외래 URL(넥슨 Open API static 이미지 등)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // 웹 환경에서는 백엔드 프록시 서버가 없으므로 원본 CDN 직접 사용
    if (isWeb) {
      return trimmed;
    }
    return `/api/proxy/image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * 아바타 이미지 로드 실패 시 원본 직접 로드 시도
 */
export function onAvatarError(e: SyntheticEvent<HTMLImageElement, Event>, originalUrl?: string) {
  const target = e.currentTarget;
  if (originalUrl && !target.src.endsWith(originalUrl)) {
    target.src = originalUrl;
  }
}

/**
 * 프록시 이미지 URL 생성기
 */
export function getProxyImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('/api/proxy') || rawUrl.startsWith('data:') || rawUrl.startsWith('/')) {
    return rawUrl;
  }
  if (isWeb) {
    return rawUrl;
  }
  return `/api/proxy/image?url=${encodeURIComponent(rawUrl)}`;
}

/**
 * 캐릭터 프로필 기본/대체 아이콘 경로 (메케줄 아이콘(투명, 테두리X).png)
 */
export const DEFAULT_AVATAR_IMAGE = '/icons/%EB%A9%94%EC%BC%80%EC%A4%84%20%EC%95%84%EC%9D%B4%EC%BD%98(%ED%88%AC%EB%AA%85%2C%20%ED%85%8C%EB%91%90%EB%A6%ACX).png';
export const DEFAULT_AVATAR_FALLBACK = '/default-avatar.png';

/**
 * 메케줄 앱 투명 로고 경로
 * 사용자가 요청한 /public/icons/메케줄 아이콘(투명).png 파일 및 표준 경로를 완벽 지원
 */
export const APP_LOGO_SRC = '/icons/%EB%A9%94%EC%BC%80%EC%A4%84%20%EC%95%84%EC%9D%B4%EC%BD%98(%ED%88%AC%EB%AA%85).png';
export const APP_LOGO_TRANSPARENT = '/app-logo-transparent.png';
export const APP_LOGO_FALLBACK = '/app-logo.png';

/**
 * 로고 이미지 로드 실패 시 투명 아이콘 및 대체 로고 순차 폴백
 */
export function onLogoError(e: SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  const currentSrc = target.src;
  if (!currentSrc.includes('app-logo-transparent.png')) {
    target.src = APP_LOGO_TRANSPARENT;
  } else if (!currentSrc.includes('app-logo.png')) {
    target.src = APP_LOGO_FALLBACK;
  }
}

/**
 * 캐릭터 프로필 아바타 이미지 실패 시 메케줄 투명 아이콘으로 대체
 */
export function handleAvatarErrorWithFallback(
  e: SyntheticEvent<HTMLImageElement, Event>,
  originalUrl?: string
) {
  const target = e.currentTarget;
  if (originalUrl && !target.src.endsWith(originalUrl) && !target.src.includes(originalUrl)) {
    target.src = originalUrl;
    return;
  }
  if (!target.src.includes('default-avatar.png') && !target.src.includes('%EB%A9%94%EC%BC%80%EC%A4%84')) {
    target.src = DEFAULT_AVATAR_IMAGE;
    target.className = 'w-full h-full object-contain p-1.5 transition-transform duration-200';
  }
}


