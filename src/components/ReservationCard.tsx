import { useEffect, useState, type FormEvent } from 'react';
import {
  formatDurationKorean,
  formatTimeShort,
  timeToMinutes,
  type Reservation,
} from '../types/reservation';

interface ReservationCardProps {
  reservation: Reservation;
  currentUserId: string | null;
  currentUserEmail: string | null;
  onUpdatePurpose: (reservation: Reservation, newPurpose: string) => Promise<void>;
  onCancel: (reservation: Reservation) => Promise<void>;
  isBusy: boolean;
}

function formatCreatedAt(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getReserverLabel(
  reservation: Reservation,
  currentUserId: string | null,
  currentUserEmail: string | null
): string {
  if (currentUserId && reservation.user_id === currentUserId && currentUserEmail) {
    return currentUserEmail.split('@')[0];
  }
  if (reservation.reserver_handle) {
    return reservation.reserver_handle;
  }
  return reservation.user_id ? `학생(${reservation.user_id.slice(0, 6)})` : '알 수 없음';
}

export function ReservationCard({
  reservation,
  currentUserId,
  currentUserEmail,
  onUpdatePurpose,
  onCancel,
  isBusy,
}: ReservationCardProps) {
  const [purposeInput, setPurposeInput] = useState(reservation.purpose);
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    setPurposeInput(reservation.purpose);
  }, [reservation.purpose]);

  const isMine = Boolean(currentUserId && reservation.user_id === currentUserId);
  const reserverLabel = getReserverLabel(reservation, currentUserId, currentUserEmail);
  const startLabel = formatTimeShort(reservation.start_time);
  const endLabel = formatTimeShort(reservation.end_time);
  const durationMinutes =
    timeToMinutes(reservation.end_time) - timeToMinutes(reservation.start_time);

  const handlePurposeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const trimmed = purposeInput.trim();
    if (!trimmed) {
      setInputError('이용 목적을 입력해 주세요.');
      return;
    }

    await onUpdatePurpose(reservation, trimmed);
  };

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <span className="text-lg font-bold font-mono-num text-blue-700 shrink-0">
              {reservation.seat_number}
            </span>
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {reservation.room_name}
            </h3>
          </div>
          {isMine && (
            <span className="shrink-0 px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
              내 예약
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
          <span className="font-mono-num">{reservation.reservation_date}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num font-semibold">
            {startLabel}~{endLabel}
          </span>
          {durationMinutes > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatDurationKorean(durationMinutes)}</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>예약자: {reserverLabel}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={reservation.created_at} className="font-mono-num">
            {formatCreatedAt(reservation.created_at)}
          </time>
        </div>

        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 break-words">
          {reservation.purpose}
        </p>
      </div>

      {isMine ? (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <form onSubmit={handlePurposeSubmit} className="flex items-center gap-2" noValidate>
            <label htmlFor={`purpose-input-${reservation.id}`} className="sr-only">
              이용 목적 수정
            </label>
            <input
              id={`purpose-input-${reservation.id}`}
              type="text"
              value={purposeInput}
              onChange={(e) => setPurposeInput(e.target.value)}
              placeholder="이용 목적 수정"
              className="min-w-0 flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={isBusy}
              className="px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              목적 수정
            </button>
          </form>

          {inputError && (
            <p className="text-xs font-medium text-red-600" role="alert">
              {inputError}
            </p>
          )}

          <button
            type="button"
            disabled={isBusy}
            onClick={() => void onCancel(reservation)}
            className="w-full py-2 px-4 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap"
          >
            예약 취소
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            다른 학우의 예약은 수정하거나 취소할 수 없습니다.
          </p>
        </div>
      )}
    </article>
  );
}
