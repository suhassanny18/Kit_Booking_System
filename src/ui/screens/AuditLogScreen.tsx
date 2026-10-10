import React from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { FileText, ShieldAlert, Clock, ArrowRight } from 'lucide-react';

export const AuditLogScreen: React.FC = () => {
  const logs = kitBookingAppInstance.auditLog();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Domain Audit Log</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {logs.length} entries
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system audit trail emitted by <code className="text-indigo-300">AuditObserver</code>. All timestamps sourced from injected Clock.
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-xs text-slate-500 font-mono italic">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const isError = log.isObserverFailure;

            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border font-mono text-xs transition-colors flex items-start justify-between gap-3 ${
                  isError
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isError
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {log.eventType}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-white">{log.actor}</span>
                      <span className="text-[10px] text-slate-500">Booking: {log.bookingId}</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs">{log.message}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
