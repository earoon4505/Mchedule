import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, ExternalLink, Copy } from 'lucide-react';

interface ApiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSlide {
  step: number;
  title: string;
  badgeTitle?: string;
  src?: string;
  images?: { src: string; alt: string }[];
}

/**
 * 넥슨 Open API 발급 방법 안내 슬라이더 모달
 * - 우측 상단 X 버튼 없음
 * - 좌우 화살표 버튼 분리(플렉스 3단)로 사진과 겹침 없음
 * - 4번 페이지: '서비스 설명에 다음 문구를 입력해주세요.' 마침표 수정, [복사] 버튼
 * - 5번 페이지: 5번 사진 + (6번 사진과 설명문 가로 나란히 배치), 'https://mchedule.com' [복사] 버튼
 * - 6번 페이지: 사진 상단에 '발급된 API 가져오기' 뱃지 표시
 */
export const ApiGuideModal: React.FC<ApiGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const lastWheelTimeRef = useRef<number>(0);

  // 복사용 텍스트 상수
  const descText = '메이플스토리 캐릭터의 보스 클리어 및 퀘스트 완료 현황을 확인하기 위한 스케줄러 서비스입니다.';
  const urlText = 'https://mchedule.com';

  const handleCopyDesc = () => {
    navigator.clipboard.writeText(descText).then(() => {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(urlText).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  // 총 8개 슬라이드
  const slides: GuideSlide[] = [
    { step: 1, title: '1단계', src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%201.PNG' },
    { step: 2, title: '2단계', src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%202.PNG' },
    { step: 3, title: '3단계', src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%203.PNG' },
    { step: 4, title: '4단계', src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%204.PNG' },
    {
      step: 5,
      title: '5단계',
      images: [
        { src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%205.PNG', alt: 'API 발급 방법 5' },
        { src: '/API%20Guide/APi%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%206.PNG', alt: 'API 발급 방법 6' },
      ],
    },
    { 
      step: 6, 
      title: '6단계', 
      badgeTitle: '발급된 API 가져오기',
      src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%207.PNG' 
    },
    { step: 7, title: '7단계', src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%208.PNG' },
    { step: 8, title: '8단계', src: '/API%20Guide/API%EB%B0%9C%EA%B8%89%20%EB%B0%A9%EB%B2%95%209.PNG' },
  ];

  // 모달이 열릴 때 첫 번째 단계로 리셋
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCopiedDesc(false);
      setCopiedUrl(false);
    }
  }, [isOpen]);

  // 키보드 좌/우 화살표 및 ESC 키 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentStep((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, onClose]);

  // 마우스 휠 이벤트 핸들러
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 260) return;

    if (e.deltaY > 20 || e.deltaX > 20) {
      if (currentStep < slides.length - 1) {
        lastWheelTimeRef.current = now;
        setCurrentStep((prev) => Math.min(slides.length - 1, prev + 1));
      }
    } else if (e.deltaY < -20 || e.deltaX < -20) {
      if (currentStep > 0) {
        lastWheelTimeRef.current = now;
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    }
  };

  if (!isOpen) return null;

  const current = slides[currentStep];

  return (
    <div
      id="api-guide-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 모달 전체 크기 고정: 너비 820px, 높이 720px */}
      <div
        id="api-guide-modal"
        onWheel={handleWheel}
        className="w-[820px] max-w-[96vw] h-[720px] max-h-[94vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 (우측 상단 X 버튼 없음) */}
        <div className="h-14 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {currentStep + 1}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              NEXON Open API 키 발급 방법
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
            {currentStep + 1} / {slides.length}
          </span>
        </div>

        {/* 본문: 좌측 버튼 - 중앙 (사진 + 설명) - 우측 버튼 */}
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-between p-3 sm:p-4 gap-2 sm:gap-3 overflow-hidden select-none min-h-0">
          {/* 이전 단계 버튼 */}
          <div className="shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              title="이전 단계 (← 또는 휠 위로)"
              className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* 중앙 콘텐츠 영역 */}
          <div className="flex-1 h-full flex flex-col items-center justify-between min-w-0 overflow-hidden">
            {/* 5번 페이지인 경우: 5번 사진(위) + [6번 사진(아래 좌측) & 설명 문구(아래 우측)] */}
            {current.step === 5 && current.images ? (
              <div className="w-full h-full flex flex-col items-center justify-between gap-2.5 p-1 min-h-0">
                {/* 5번 메인 사진 (위) */}
                <div className="flex-1 w-full flex items-center justify-center min-h-0">
                  <img
                    src={current.images[0].src}
                    alt={current.images[0].alt}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-xs border border-slate-200/70 dark:border-slate-800"
                  />
                </div>

                {/* 6번 사진과 설명 문구를 가로로 나란히 배치 */}
                <div className="w-full shrink-0 flex items-stretch gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  {/* 6번 사진 (왼쪽) */}
                  <div className="shrink-0 flex items-center justify-center">
                    <img
                      src={current.images[1].src}
                      alt={current.images[1].alt}
                      className="h-[120px] w-auto max-w-[210px] sm:max-w-[260px] object-contain rounded-lg shadow-xs border border-slate-200/70 dark:border-slate-800 bg-white"
                    />
                  </div>

                  {/* 설명 문구 (6번 사진 오른쪽) & URL 복사 버튼 */}
                  <div className="flex-1 flex flex-col justify-between py-0.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 gap-1.5">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        개발 환경에서 'Web'을 선택해주세요.
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        URL에 <strong className="text-blue-600 dark:text-blue-400 font-bold select-all">'https://mchedule.com'</strong>을 입력해주세요.
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        캐릭터를 선택해주세요.
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        '등록' 버튼을 누르면 API가 발급됩니다.
                      </p>
                    </div>

                    {/* 4번 항목: URL 복사 상자 & 버튼 */}
                    <div className="mt-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 select-all truncate">
                        {urlText}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="shrink-0 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                      >
                        {copiedUrl ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span>복사완료!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-white" />
                            <span>복사</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 일반 슬라이드 (1, 2, 3, 4, 6, 7, 8번 페이지) */
              <>
                {/* 사진 영역 */}
                <div className="relative flex-1 w-full flex items-center justify-center min-h-0 p-1">
                  {/* 1. 6번 페이지: '발급된 API 가져오기'를 사진 위에 오버레이 뱃지로 표시 */}
                  {current.badgeTitle && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-md border border-blue-400/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {current.badgeTitle}
                      </span>
                    </div>
                  )}

                  <img
                    key={current.src}
                    src={current.src}
                    alt={`API 발급 가이드 ${current.title}`}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-xs border border-slate-200/70 dark:border-slate-800"
                  />
                </div>

                {/* 사진 아래 설명 박스 */}
                <div className="w-full shrink-0 pt-2 pb-1 px-2">
                  <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    {/* 1번 페이지 설명 */}
                    {current.step === 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 space-y-1">
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            넥슨 Open API 사이트에 접속해주세요.
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            마이 페이지 → 애플리케이션 등록으로 이동해주세요.
                          </p>
                        </div>
                        <a
                          href="https://openapi.nexon.com"
                          target="_blank"
                          rel="noreferrer"
                          style={{ backgroundColor: '#0077ff' }}
                          className="self-start sm:self-auto py-2 px-3 rounded-xl text-white hover:brightness-110 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                        >
                          <span>넥슨 Open API 바로가기</span>
                          <ExternalLink className="w-3.5 h-3.5 text-white/90" />
                        </a>
                      </div>
                    )}

                    {/* 2번 페이지 설명 */}
                    {current.step === 2 && (
                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          약관을 모두 읽은 후 동의해주세요.
                        </p>
                      </div>
                    )}

                    {/* 3번 페이지 설명 */}
                    {current.step === 3 && (
                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          '메이플스토리'를 선택해주세요.
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          '서비스 단계'를 선택해주세요.
                        </p>
                      </div>
                    )}

                    {/* 4번 페이지 설명 및 복사 버튼 */}
                    {current.step === 4 && (
                      <div className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        <div className="space-y-1 font-medium">
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            '한국어'를 선택해주세요.
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            서비스명을 <strong className="text-orange-600 dark:text-orange-400 font-bold">'메케줄'</strong>로 입력해주세요.
                          </p>
                          {/* 5번 항목: 마침표(.)로 수정 */}
                          <p className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                            서비스 설명에 다음 문구를 입력해주세요.
                          </p>
                        </div>

                        {/* 복사 상자 & 2번 항목: '복사' 버튼 */}
                        <div className="mt-1.5 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2.5">
                          <span className="text-xs font-normal text-slate-700 dark:text-slate-300 select-all leading-relaxed">
                            {descText}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyDesc}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                          >
                            {copiedDesc ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-white" />
                                <span>복사</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 6번 페이지 설명 */}
                    {current.step === 6 && (
                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          마이 페이지 → 애플리케이션 목록으로 이동해주세요.
                        </p>
                      </div>
                    )}

                    {/* 7번 페이지 설명 */}
                    {current.step === 7 && (
                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          '메이플스토리'를 클릭해주세요.
                        </p>
                      </div>
                    )}

                    {/* 8번 페이지 설명 */}
                    {current.step === 8 && (
                      <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          발급된 API가 표시됩니다.
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          API를 복사한 후 메케줄에 등록해주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 다음 단계 버튼 */}
          <div className="shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={currentStep === slides.length - 1}
              title="다음 단계 (→ 또는 휠 아래로)"
              className="p-2 sm:p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 슬라이드 인디케이터 (도트) */}
        <div className="h-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 shrink-0 px-4">
          {slides.map((item, idx) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'w-6 bg-orange-500'
                  : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
              }`}
              title={`${idx + 1}단계 보기`}
            />
          ))}
        </div>

        {/* 하단 푸터: 우측 하단 닫기 버튼 단독 배치 */}
        <div className="h-14 px-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>닫기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
