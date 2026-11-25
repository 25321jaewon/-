import { formatTimeShort, type Reservation, type RoomConfig } from '../types/reservation';

interface SeatMapProps {
  room: RoomConfig;
  reservationsForSlot: Reservation[];
  selectedSeat: string | null;
  currentUserId: string | null;
  onSelectSeat: (seatNumber: string) => void;
}

export function SeatMap({
  room,
  reservationsForSlot,
  selectedSeat,
  currentUserId,
  onSelectSeat,
}: SeatMapProps) {
  const reservationBySeat = new Map<string, Reservation>();
  for (const item of reservationsForSlot) {
    if (!reservationBySeat.has(item.seat_number)) {
      reservationBySeat.set(item.seat_number, item);
    }
  }

  const totalSeats = room.seats.length;
  const reservedCount = room.seats.filter((seat) => reservationBySeat.has(seat)).length;
  const availableCount = totalSeats - reservedCount;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 h-full">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{room.name} 좌석 배치도</h2>
          <p className="mt-0.5 text-xs text-slate-500">{room.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono-num shrink-0">
          <span>전체 {totalSeats}석</span>
          <span aria-hidden="true">·</span>
          <span className="text-blue-700 font-semibold">가능 {availableCount}석</span>
          <span aria-hidden="true">·</span>
          <span>예약됨 {reservedCount}석</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-4 text-center text-xs font-medium text-slate-500">
        출입문 · 칠판 / 안내 데스크 방향
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {room.seats.map((seat) => {
          const existing = reservationBySeat.get(seat);
          const isReserved = Boolean(existing);
          const isMine = Boolean(existing && currentUserId && existing.user_id === currentUserId);
          const isSelected = selectedSeat === seat;

          let cardStyle =
            'bg-white border-slate-200 text-slate-900 hover:border-blue-600 hover:bg-blue-50/40';
          if (isSelected) {
            cardStyle =
              'bg-blue-50 border-blue-700 text-blue-950 ring-2 ring-blue-600/20';
          } else if (isMine) {
            cardStyle =
              'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500';
          } else if (isReserved) {
            cardStyle =
              'bg-slate-100 border-slate-200 text-slate-500 hover:border-slate-400';
          }

          return (
            <button
              key={seat}
              type="button"
              onClick={() => onSelectSeat(seat)}
              aria-pressed={isSelected}
              className={`min-h-[86px] p-3 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${cardStyle}`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="text-base font-bold font-mono-num">{seat}</span>
                {isMine ? (
                  <span className="text-[11px] font-semibold text-emerald-700">내 예약</span>
                ) : isReserved ? (
                  <span className="text-[11px] font-medium text-slate-500">예약됨</span>
                ) : (
                  <span className="text-[11px] font-medium text-blue-700">가능</span>
                )}
              </div>

              <div className="text-xs w-full mt-2 space-y-0.5">
                {existing ? (
                  <>
                    <div className="font-medium truncate">
                      {existing.reserver_handle || '예약자'}
                    </div>
                    <div className="text-[11px] font-mono-num opacity-80 truncate">
                      {formatTimeShort(existing.start_time)}~{formatTimeShort(existing.end_time)}
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400">선택하여 예약</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white inline-block" />
          <span>예약 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border border-blue-700 bg-blue-50 inline-block" />
          <span>현재 선택</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border border-emerald-400 bg-emerald-50 inline-block" />
          <span>내 예약</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-slate-100 inline-block" />
          <span>다른 학우 예약</span>
        </div>
      </div>
    </div>
  );
}
