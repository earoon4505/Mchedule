import React from 'react';
import { CharacterInfo } from '../../types';

interface ConversionPageViewProps {
  character: CharacterInfo | null;
  onUpdateCharacter?: (updatedChar: CharacterInfo) => void;
}

/**
 * 웹 배포본 전용 Stub 컴포넌트
 * - 웹 배포 시 환산/스카우터 관련 일체의 코드 및 문자열이 번들에 포함되지 않도록 100% 격리
 */
export const ConversionPageView: React.FC<ConversionPageViewProps> = () => {
  return null;
};
