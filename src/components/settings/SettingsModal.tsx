import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Monitor, 
  Volume2, 
  Download, 
  Upload, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle2,
  Moon,
  Sun,
  Tv,
  Eye,
  Sliders,
  EyeOff,
  LayoutGrid,
  Star,
  User,
  RefreshCw,
  RotateCw,
  Trash2,
  Minus,
  Plus,
  Maximize2,
  Sparkles,
  Bell,
  Clock,
  ExternalLink,
  X,
  Check
} from 'lucide-react';
import { AppSettings, PipDirection, PipSettings, NotificationSettings } from '../../types';
import { BlackMageSilhouetteIcon } from '../common/BlackMageIcon';
import { supportsPiP, supportsAutoStart, supportsFileBackup, isWeb } from '../../utils/platform';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  hasApiKey: boolean;
  onOpenApiKeyModal?: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  hasApiKey,
  onOpenApiKeyModal,
  onExportData,
  onImportData,
  onResetAllData,
}) => {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isDownloadingApp, setIsDownloadingApp] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // 웹 환경 기본 로직
  }, []);

  if (!isOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3000);
  };

  const triggerFileDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
  };

  const handleDownloadOrInstallApp = async () => {
    if (isDownloadingApp) return;
    setIsDownloadingApp(true);
    showNotification('최신 데스크톱 앱 다운로드를 시작합니다.');

    // 신규 GitHub 저장소: earoon4505 / Mchedule-exe-file
    const repoReleasesUrl = 'https://github.com/earoon4505/Mchedule-exe-file/releases';
    const repoLatestUrl = 'https://github.com/earoon4505/Mchedule-exe-file/releases/latest';

    try {
      // 1. GitHub 최신 릴리즈의 .exe 다운로드 링크 조회
      const response = await fetch('https://api.github.com/repos/earoon4505/Mchedule-exe-file/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (response.ok) {
        const data = await response.json();
        const exeAsset = data.assets?.find((asset: { name?: string; browser_download_url?: string }) => 
          asset.name?.toLowerCase().endsWith('.exe')
        );

        if (exeAsset?.browser_download_url) {
          triggerFileDownload(exeAsset.browser_download_url);
          return;
        }
      }

      // 2. 최신 릴리즈에 에셋이 없거나 404일 경우 전체 릴리즈 목록에서 최신 .exe 탐색
      const allReleasesResponse = await fetch('https://api.github.com/repos/earoon4505/Mchedule-exe-file/releases', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (allReleasesResponse.ok) {
        const releases = await allReleasesResponse.json();
        if (Array.isArray(releases) && releases.length > 0) {
          for (const rel of releases) {
            const asset = rel.assets?.find((a: { name?: string; browser_download_url?: string }) =>
              a.name?.toLowerCase().endsWith('.exe')
            );
            if (asset?.browser_download_url) {
              triggerFileDownload(asset.browser_download_url);
              return;
            }
          }
        }
      }

      // 3. API 조회 실패 시 최신 릴리즈 페이지로 이동
      triggerFileDownload(repoLatestUrl);
    } catch {
      triggerFileDownload(repoReleasesUrl);
    } finally {
      setTimeout(() => {
        setIsDownloadingApp(false);
      }, 2000);
    }
  };

  const pip: PipSettings = {
    enabled: false,
    opacity: 90,
    direction: 'horizontal',
    align: 'right',
    position: 'top',
    hideCompleted: false,
    onlyFavorites: false,
    onlyAvatar: false,
    visibleCount: 6,
    showCommonContent: false,
    ...settings.pip,
  };

  const notifier: NotificationSettings = {
    enabled: false,
    hours: 1,
    minutes: 0,
    onlyFavorites: false,
    ...settings.notifier,
  };

  const updateNotifier = (partial: Partial<NotificationSettings>) => {
    onUpdateSettings({
      notifier: {
        ...notifier,
        ...partial,
      },
    });
  };

  const updatePipSettings = (partial: Partial<PipSettings>) => {
    onUpdateSettings({
      pip: {
        ...pip,
        ...partial,
      },
    });
  };

  const handleExecuteResetAll = () => {
    onResetAllData();
    setIsConfirmingReset(false);
    showNotification('모든 데이터가 성공적으로 초기화되었습니다.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportData(file);
      e.target.value = '';
    }
  };

  return (
    <div 
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div 
        id="settings-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">설정</h3>
            </div>
          </div>
        </div>

        {/* 상단 알림 메시지 배너 */}
        {notificationMsg && (
          <div className={`px-6 py-2.5 flex items-center gap-2 text-xs font-semibold ${
            notificationMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notificationMsg.text}</span>
          </div>
        )}

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* 1. 테마 설정 (다크 모드 / 라이트 모드) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              화면 테마
            </h4>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                {settings.darkMode ? (
                  <Moon className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {settings.darkMode ? '다크 모드' : '라이트 모드'}
                </span>
              </div>

              <button
                id="btn-settings-darkmode-toggle"
                onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.darkMode ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. PiP 모드 & 캐릭터 카드 정렬 스타일 설정 (데스크톱 전용) */}
          {supportsPiP && (
          <div className="space-y-3.5 p-4 rounded-2xl bg-orange-50/40 dark:bg-slate-800/60 border border-orange-200/70 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Tv className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  PiP모드
                </h4>
              </div>

              {/* PiP 모드 ON/OFF 토글 */}
              <button
                id="btn-settings-pip-toggle"
                onClick={() => {
                  const nextEnabled = !pip.enabled;
                  if ((window as any).electronAPI?.togglePiPWindow) {
                    (window as any).electronAPI.togglePiPWindow();
                  }
                  updatePipSettings({ enabled: nextEnabled });
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  pip.enabled ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    pip.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 프로필 사진만 나오게 축소 (onlyAvatar) */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <User className="w-3.5 h-3.5 text-orange-500" />
                <span>프로필 사진만 표시</span>
              </div>

              <button
                onClick={() => updatePipSettings({ onlyAvatar: !pip.onlyAvatar })}
                className={`w-11 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  pip.onlyAvatar ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    pip.onlyAvatar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 모든 스케줄 완료 시 해당 캐릭터 카드 pip 안 보이게 하기 */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <EyeOff className="w-3.5 h-3.5 text-orange-500" />
                <span>완료된 캐릭터 숨기기</span>
              </div>

              <button
                onClick={() => updatePipSettings({ hideCompleted: !pip.hideCompleted })}
                className={`w-11 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  pip.hideCompleted ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    pip.hideCompleted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 즐겨찾기 한 캐릭터 카드만 PiP에 표시 */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>즐겨찾기만 표시</span>
              </div>

              <button
                onClick={() => updatePipSettings({ onlyFavorites: !pip.onlyFavorites })}
                className={`w-11 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  pip.onlyFavorites ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    pip.onlyFavorites ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 계정 컨텐츠 표시 */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>계정 컨텐츠 표시</span>
              </div>

              <button
                onClick={() => updatePipSettings({ showCommonContent: !pip.showCommonContent })}
                className={`w-11 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  pip.showCommonContent ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    pip.showCommonContent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 정렬 방법 : 가로 or 세로 */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <LayoutGrid className="w-3.5 h-3.5 text-orange-500" />
                <span>정렬 방법</span>
              </div>

              <div className="flex rounded-xl bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => updatePipSettings({ direction: 'horizontal' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pip.direction === 'horizontal'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
                  }`}
                >
                  가로
                </button>
                <button
                  type="button"
                  onClick={() => updatePipSettings({ direction: 'vertical' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pip.direction === 'vertical'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
                  }`}
                >
                  세로
                </button>
              </div>
            </div>

            {/* PiP 크기 조절 (1 ~ 8) */}
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Maximize2 className="w-3.5 h-3.5 text-orange-500" />
                <span>PiP 크기 조절</span>
              </div>

              <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    const current = pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4);
                    if (current > 1) {
                      updatePipSettings({ visibleCount: current - 1 });
                    }
                  }}
                  disabled={(pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4)) <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="크기 줄이기 (-1)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="w-8 text-center text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                  {pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4)}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const current = pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4);
                    if (current < 8) {
                      updatePipSettings({ visibleCount: current + 1 });
                    }
                  }}
                  disabled={(pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4)) >= 8}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  title="크기 늘리기 (+1)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 투명도 슬라이더 */}
            <div className="pt-2 border-t border-orange-200/60 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Eye className="w-3.5 h-3.5 text-orange-500" />
                <span>투명도 ({pip.opacity}%)</span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                <span className="text-[10px] text-slate-400 font-medium">20%</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={pip.opacity}
                  onChange={(e) => updatePipSettings({ opacity: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-[10px] text-slate-400 font-medium">100%</span>
              </div>
            </div>
          </div>
          )}

          {/* 3. 알림이 기능 설정 */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    알림이
                  </h4>
                </div>
              </div>

              {/* 즐겨찾기 캐릭터만 적용 버튼 및 알림이 토글 스위치 */}
              <div className="flex flex-col items-end gap-1.5">
                {/* 알림이 토글 버튼 위: 즐겨찾기 캐릭터만 적용 버튼 */}
                <button
                  type="button"
                  id="btn-notifier-only-favorites"
                  onClick={() => updateNotifier({ onlyFavorites: !notifier.onlyFavorites })}
                  disabled={!notifier.enabled}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    !notifier.enabled
                      ? 'opacity-35 pointer-events-none bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-700'
                      : notifier.onlyFavorites
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="즐겨찾기로 등록된 캐릭터만 초기화 알림을 받습니다"
                >
                  <Star
                    className={`w-3 h-3 ${
                      notifier.onlyFavorites && notifier.enabled
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>즐겨찾기 캐릭터만 적용</span>
                </button>

                {/* 알림이 토글 스위치 */}
                <button
                  type="button"
                  id="btn-settings-notifier-toggle"
                  onClick={() => updateNotifier({ enabled: !notifier.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    notifier.enabled ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  title={notifier.enabled ? '알림이 끄기' : '알림이 켜기'}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      notifier.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 시간 및 분 조절 칸 (PIP 크기 조절처럼 칸 각각 생성) */}
            {notifier.enabled && (
              <div className="pt-3 border-t border-rose-200/60 dark:border-rose-900/40 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3">
                  {/* 시간 조절 칸 (0시 ~ 23시) */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">시간</span>
                    </div>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        id="btn-notifier-hours-minus"
                        onClick={() => {
                          const cur = notifier.hours || 0;
                          if (cur > 0) updateNotifier({ hours: cur - 1 });
                        }}
                        disabled={(notifier.hours || 0) <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="시간 줄이기 (-1시간)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-10 text-center text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                        {notifier.hours || 0}시간
                      </span>

                      <button
                        type="button"
                        id="btn-notifier-hours-plus"
                        onClick={() => {
                          const cur = notifier.hours || 0;
                          if (cur < 23) updateNotifier({ hours: cur + 1 });
                        }}
                        disabled={(notifier.hours || 0) >= 23}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="시간 늘리기 (+1시간)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 분 조절 칸 (0분 ~ 55분, 5분 단위) */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">분</span>
                    </div>

                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        id="btn-notifier-minutes-minus"
                        onClick={() => {
                          const cur = notifier.minutes || 0;
                          if (cur >= 5) updateNotifier({ minutes: cur - 5 });
                        }}
                        disabled={(notifier.minutes || 0) <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="분 줄이기 (-5분)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-10 text-center text-xs font-black text-slate-800 dark:text-slate-100 select-none">
                        {notifier.minutes || 0}분
                      </span>

                      <button
                        type="button"
                        id="btn-notifier-minutes-plus"
                        onClick={() => {
                          const cur = notifier.minutes || 0;
                          if (cur <= 50) updateNotifier({ minutes: cur + 5 });
                        }}
                        disabled={(notifier.minutes || 0) >= 55}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="분 늘리기 (+5분)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 설정 안내 문구 */}
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-rose-200/40 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-ping" />
                  <span>
                    컨텐츠 초기화 <strong className="text-rose-600 dark:text-rose-400 font-bold">{notifier.hours}시간 {notifier.minutes}분 전</strong>에 미완료된 컨텐츠, 캐릭터를 알립니다.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. 기타 시스템 옵션 (자동 갱신 주기, Windows 시작 시 자동 실행, 사운드) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              시스템 및 편의 옵션
            </h4>

            {/* 자동 갱신 주기 선택 */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">자동 갱신 주기</span>
                </div>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  {settings.autoSyncIntervalSec < 60
                    ? `${settings.autoSyncIntervalSec}초`
                    : `${Math.floor(settings.autoSyncIntervalSec / 60)}분`}마다
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                {[
                  { label: '10초', value: 10 },
                  { label: '30초', value: 30 },
                  { label: '1분', value: 60 },
                  { label: '2분', value: 120 },
                  { label: '3분', value: 180 },
                  { label: '5분', value: 300 },
                  { label: '10분', value: 600 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSettings({ autoSyncIntervalSec: opt.value })}
                    className={`py-1.5 px-1 text-xs font-bold rounded-xl transition-all border text-center ${
                      (settings.autoSyncIntervalSec || 300) === opt.value
                        ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Windows 시작 시 자동 실행 (데스크톱 전용) */}
            {supportsAutoStart && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Windows 시작 시 자동 실행</span>
                </div>

                <button
                  onClick={() => {
                    const nextVal = !settings.autoStart;
                    onUpdateSettings({ autoStart: nextVal });
                    if (typeof window !== 'undefined' && (window as any).electronAPI?.setAutoStart) {
                      (window as any).electronAPI.setAutoStart(nextVal);
                    }
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.autoStart ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.autoStart ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* 사운드 효과음 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">체크 사운드 효과음</span>
              </div>

              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. 캐릭터 카드 완료 기준 설정 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              캐릭터 카드 완료 기준 설정
            </h4>

            {/* 검은 마법사 포함 여부 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <BlackMageSilhouetteIcon
                  size={16}
                  className="text-red-500 flex-shrink-0"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">검은 마법사 포함</span>
              </div>

              <button
                id="btn-settings-include-black-mage"
                type="button"
                onClick={() => onUpdateSettings({ includeBlackMageInCompletion: !settings.includeBlackMageInCompletion })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.includeBlackMageInCompletion ? 'bg-red-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.includeBlackMageInCompletion ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 커스텀 스케줄 포함 여부 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">커스텀 스케줄 포함</span>
              </div>

              <button
                id="btn-settings-include-custom"
                type="button"
                onClick={() => onUpdateSettings({ includeCustomInCompletion: !settings.includeCustomInCompletion })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.includeCustomInCompletion ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full ${settings.includeCustomInCompletion ? 'bg-white dark:bg-zinc-900' : 'bg-white'} transition-transform ${
                    settings.includeCustomInCompletion ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. 데이터 백업 및 복원 & 데이터 초기화 */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              데이터 관리 및 초기화
            </h4>
            
            {/* 백업 / 복원 버튼 (데스크톱 전용) */}
            {supportsFileBackup && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={onExportData}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-sky-500" />
                  <span>데이터 백업 (JSON)</span>
                </button>

                <label className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  <span>데이터 복원</span>
                  <input
                    type="file"
                    accept=".json"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}

            {/* 메케줄 Window APP 다운로드 버튼 (웹 브라우저 환경에서만 노출, 데스크톱 앱 내부에서는 숨김) */}
            {isWeb && (
              <div className="pt-2">
                <button
                  id="btn-download-window-app"
                  type="button"
                  disabled={isDownloadingApp}
                  onClick={handleDownloadOrInstallApp}
                  className="w-full p-3 rounded-2xl text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50/80 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 border border-sky-200 dark:border-sky-800/60 transition-all flex items-center justify-center gap-2 shadow-xs group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Monitor className="w-4 h-4 text-sky-500 group-hover:scale-110 transition-transform" />
                  <span>
                    {isDownloadingApp ? '설치 파일(.exe) 다운로드 중...' : '메케줄 Windows 데스크톱 앱 (.exe) 다운로드'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-200/70 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 font-bold flex items-center gap-1">
                    <Download className={`w-2.5 h-2.5 ${isDownloadingApp ? 'animate-bounce' : ''}`} />
                    최신 버전
                  </span>
                </button>
              </div>
            )}

            {/* 데이터 초기화 버튼 */}
            <div className="pt-1">
              <button
                id="btn-reset-all-start"
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full p-2.5 rounded-2xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>데이터 초기화</span>
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 화면 중앙에 표시되는 데이터 초기화 전용 확인 모달 */}
      {isConfirmingReset && (
        <div 
          id="reset-confirm-modal-backdrop"
          className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div 
            id="reset-confirm-modal"
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  정말 모든 데이터를 완전히 초기화하시겠습니까?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  등록된 모든 메이플스토리 캐릭터, 설정, 완료 기록 및 <strong className="text-rose-600 dark:text-rose-400 font-bold">저장되어 있는 API 키도 영구히 삭제</strong>됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                취소
              </button>
              <button
                id="btn-confirm-reset-all"
                type="button"
                onClick={handleExecuteResetAll}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>데이터 초기화 실행</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

