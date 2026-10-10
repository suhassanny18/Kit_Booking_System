import React from 'react';
import { BookingStatus } from '../../domain/enums';
import { Check, XCircle, Ban, ArrowRight } from 'lucide-react';

interface StateTimelineProps {
  currentStatus: BookingStatus;
}

export const StateTimeline: React.FC<StateTimelineProps> = ({ currentStatus }) => {
  const happyPath = [
    BookingStatus.REQUESTED,
    BookingStatus.NEGOTIATING,
    BookingStatus.APPROVED,
    BookingStatus.PICKED_UP,
    BookingStatus.RETURNED,
    BookingStatus.COMPLETED,
  ];

  const isTerminalExit = currentStatus === BookingStatus.REJECTED || currentStatus === BookingStatus.CANCELLED;

  const getStepIndex = (status: BookingStatus): number => {
    switch (status) {
      case BookingStatus.REQUESTED:
        return 0;
      case BookingStatus.NEGOTIATING:
        return 1;
      case BookingStatus.APPROVED:
        return 2;
      case BookingStatus.PICKED_UP:
        return 3;
      case BookingStatus.RETURNED:
        return 4;
      case BookingStatus.COMPLETED:
        return 5;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 my-3">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
        <span>BOOKING LIFECYCLE STATE MACHINE</span>
        <span className="text-slate-300">
          Current: <strong className="text-white font-semibold">{currentStatus}</strong>
        </span>
      </div>

      {/* Main Happy Path Timeline */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
        {happyPath.map((step, idx) => {
          const isPassed = !isTerminalExit && currentIndex > idx;
          const isCurrent = currentStatus === step;
          const isUpcoming = isTerminalExit || currentIndex < idx;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center min-w-[72px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-4 ring-amber-500/20'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] font-mono mt-1 text-center whitespace-nowrap ${
                    isCurrent ? 'text-amber-400 font-bold' : isPassed ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {step}
                </span>
              </div>

              {idx < happyPath.length - 1 && (
                <div
                  className={`flex-1 h-0.5 min-w-[16px] mb-4 ${
                    !isTerminalExit && currentIndex > idx ? 'bg-emerald-500/50' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Branch Exits (REJECTED & CANCELLED) */}
      {isTerminalExit && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${
              currentStatus === BookingStatus.REJECTED
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-slate-800/80 border-slate-600/40 text-slate-300'
            }`}
          >
            {currentStatus === BookingStatus.REJECTED ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Ban className="w-4 h-4 text-slate-400" />
            )}
            <span>Terminal Branch Exit: {currentStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
};
