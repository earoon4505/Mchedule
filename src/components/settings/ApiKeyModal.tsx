import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Sparkles,
  Edit2,
  Plus
} from 'lucide-react';
import { 
  fetchApiKeys, 
  addApiKey, 
  updateApiKeyAlias, 
  removeApiKey, 
  getApiKeyInfo
} from '../../services/api';
import { ApiKeyItem } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: (hasKey: boolean) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 개별 키 수정 모드
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState('');
  
  // 개별 키 삭제 확인 상태
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 모달 열릴 때 최신 API 키 목록 불러오기
  const loadKeys = async () => {
    setIsLoading(true);
    setMessage(null);
    setEditingKeyId(null);
    setDeletingKeyId(null);
    try {
      const res = await fetchApiKeys();
      if (res.success && res.keys) {
        setKeys(res.keys);
        onKeyUpdated(res.keys.length > 0);
      } else {
        const info = await getApiKeyInfo();
        if (info.keys && info.keys.length > 0) {
          setKeys(info.keys);
          onKeyUpdated(true);
        } else {
          setKeys([]);
          onKeyUpdated(info.hasApiKey);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKeys();
      setAliasInput('');
      setApiKeyInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. 신규 API 키 등록
  const handleAddKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) {
      setMessage({ type: 'error', text: '등록할 API 키를 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await addApiKey(apiKeyInput.trim(), aliasInput.trim() || undefined);
    setIsLoading(false);

    if (res.success && res.keys) {
      setKeys(res.keys);
      setAliasInput('');
      setApiKeyInput('');
      setMessage({ 
        type: 'success', 
        text: res.message || 'API 키가 성공적으로 등록되었습니다!' 
      });
      onKeyUpdated(res.keys.length > 0);
    } else {
      setMessage({ type: 'error', text: res.error || 'API 키 등록에 실패했습니다.' });
    }
  };

  // 2. API 키 닉네임 수정 시작
  const handleStartEdit = (keyItem: ApiKeyItem) => {
    setEditingKeyId(keyItem.id);
    setEditingAlias(keyItem.alias);
    setDeletingKeyId(null);
  };

  // 2-1. 닉네임 수정 저장
  const handleSaveEdit = async (id: string) => {
    if (!editingAlias.trim()) {
      setMessage({ type: 'error', text: '변경할 닉네임을 입력해주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await updateApiKeyAlias(id, editingAlias.trim());
    setIsLoading(false);

    if (res.success && res.keys) {
      setKeys(res.keys);
      setEditingKeyId(null);
      setMessage({ type: 'success', text: '닉네임이 성공적으로 변경되었습니다.' });
    } else {
      setMessage({ type: 'error', text: res.error || '닉네임 수정에 실패했습니다.' });
    }
  };

  // 3. 특정 API 키 삭제
  const handleDeleteKey = async (id: string) => {
    setIsLoading(true);
    setMessage(null);

    const res = await removeApiKey(id);
    setIsLoading(false);
    setDeletingKeyId(null);

    if (res.success && res.keys) {
      setKeys(res.keys);
      setMessage({ type: 'info', text: '선택한 API 키가 삭제되었습니다.' });
      onKeyUpdated(res.keys.length > 0);
    } else {
      setMessage({ type: 'error', text: res.error || 'API 키 삭제에 실패했습니다.' });
    }
  };

  // 키 복사
  const handleCopyKey = (keyText: string, keyId: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const hasAnyKey = keys.length > 0;

  return (
    <div 
      id="api-key-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div 
        id="api-key-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                NEXON Open API 등록 및 관리
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 스크롤 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* 상태 알림 메시지 */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150 ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : message.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {message.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
              {message.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {message.type === 'info' && <Sparkles className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1">{message.text}</span>
            </div>
          )}

          {/* 1. 현재 등록 상태 카드 (요구사항: '(연동 활성화)' 제거 -> 'API키 등록 완료') */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                현재 API 등록 상태
              </span>
              {hasAnyKey ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  API키 등록 완료
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-extrabold">
                    {keys.length}개
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  API 키 미등록 (대기 중)
                </span>
              )}
            </div>

            {/* 2. 보안 마스킹은 제거하고 API 리스트를 보여준다 */}
            {hasAnyKey && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>등록된 API 목록</span>
                  <span>총 {keys.length}개 등록됨</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                  {keys.map((item, idx) => {
                    const isEditing = editingKeyId === item.id;
                    const isDeleting = deletingKeyId === item.id;
                    const isCopied = copiedKeyId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 shadow-xs flex flex-col gap-1.5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {/* 닉네임 및 수정 폼 */}
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <input
                                type="text"
                                value={editingAlias}
                                onChange={(e) => setEditingAlias(e.target.value)}
                                placeholder="닉네임 입력"
                                className="w-32 px-2 py-0.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-orange-400 rounded-md text-slate-800 dark:text-slate-100 focus:outline-hidden"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(item.id);
                                  if (e.key === 'Escape') setEditingKeyId(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={isLoading}
                                className="px-2 py-0.5 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKeyId(null)}
                                className="px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black truncate max-w-[120px]">
                                {item.alias || `API ${idx + 1}`}
                              </span>
                            </div>
                          )}

                          {/* 우측 수정 / 삭제 버튼 (수정: 닉네임만 수정 가능) */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isDeleting ? (
                              <div className="flex items-center gap-1 animate-in fade-in duration-100">
                                <span className="text-[10px] font-bold text-rose-600">삭제할까요?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKey(item.id)}
                                  disabled={isLoading}
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 rounded"
                                >
                                  확인
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingKeyId(null)}
                                  className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  className="p-1 text-slate-500 hover:text-orange-500 dark:text-slate-400 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                  title="닉네임 수정"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingKeyId(item.id)}
                                  className="p-1 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                  title="API 키 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 보안 마스킹 없는 실제 API 키 텍스트 및 복사 버튼 */}
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                          <code className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 truncate select-all flex-1">
                            {item.apiKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(item.apiKey, item.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded flex-shrink-0"
                            title="API 키 복사"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. 신규 API 키 입력 및 등록 폼 */}
          <form onSubmit={handleAddKey} className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-orange-500" />
                API 키 신규 등록
              </span>
            </div>

            {/* API 이름 입력 */}
            <div className="space-y-1">
              <label htmlFor="input-api-alias" className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                API 이름
              </label>
              <input
                id="input-api-alias"
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* API 키 입력 */}
            <div className="space-y-1">
              <label htmlFor="input-api-key" className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                API 키
              </label>
              <div className="relative">
                <input
                  id="input-api-key"
                  type={showPassword ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {apiKeyInput && (
                    <button
                      type="button"
                      onClick={() => setApiKeyInput('')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                      title="입력창 지우기"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
                    title={showPassword ? '키 숨기기' : '키 보기'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 등록 버튼 */}
            <div className="pt-1">
              <button
                type="submit"
                id="btn-save-api-key"
                disabled={isLoading || !apiKeyInput.trim()}
                className="w-full py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>API 등록</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* 4. API 키 발급 가이드 */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 dark:text-amber-300">
                NEXON Open API 키 발급 안내
              </span>
              <a
                href="https://openapi.nexon.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>넥슨 Open API 바로가기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px] list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-slate-800 dark:text-slate-100">openapi.nexon.com</strong> 로그인
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-100">마이페이지 &gt; 내 애플리케이션 등록</strong>에서 [메이플스토리] 선택
              </li>
              <li>
                발급받은 <strong className="text-orange-600 dark:text-orange-400 font-mono">API Key</strong>를 복사하여 위 입력창에 등록
              </li>
            </ol>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
