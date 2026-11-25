import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { BannerState } from '../types/reservation';

interface StatusBannerProps {
  banner: BannerState | null;
  onDismiss: () => void;
}

export function StatusBanner({ banner, onDismiss }: StatusBannerProps) {
  if (!banner) {
    return null;
  }

  const isSuccess = banner.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-50 transition-opacity duration-150 shadow-lg ${
        isSuccess ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {isSuccess ? (
            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-sm font-bold tracking-tight shrink-0">
                {isSuccess ? '요청 성공' : '요청 실패'}
              </span>
              <p className="text-base font-medium leading-snug break-words whitespace-pre-wrap">
                {banner.message}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="알림 닫기"
          className="p-1.5 rounded-lg hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
