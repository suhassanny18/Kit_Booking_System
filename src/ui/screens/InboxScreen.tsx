import React from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, Inbox, MailOpen } from 'lucide-react';

interface InboxScreenProps {
  currentActorId: string;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({ currentActorId }) => {
  const messages = kitBookingAppInstance.inbox(currentActorId);
  const currentUser = kitBookingAppInstance.getUser(currentActorId);
  const currentOwner = kitBookingAppInstance.getOwner(currentActorId);
  const actorName = currentOwner?.name || currentUser?.name || currentActorId;

  const handleMarkAllRead = () => {
    messages.forEach((m) => {
      kitBookingAppInstance.markInboxRead(currentActorId, m.id);
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Actor Notification Inbox</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {messages.length} messages
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Delivered via Observer Pattern (<span className="text-white">{actorName}</span>). Decoupled cross-cutting side channel.
          </p>
        </div>

        {messages.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </motion.button>
        )}
      </motion.div>

      {messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center"
        >
          <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No notifications yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Whenever a booking request, counter offer, approval, or completion occurs, observers will deliver alerts here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ scale: 1.008, x: 2 }}
                whileTap={{ scale: 0.995 }}
                onClick={() => kitBookingAppInstance.markInboxRead(currentActorId, msg.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  msg.read
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                    : 'bg-slate-900 border-amber-500/30 text-slate-100 shadow-md ring-1 ring-amber-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        msg.read ? 'bg-slate-700' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                          {msg.eventType}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          From: <span className="text-white">{msg.sender}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Ref: {msg.bookingId}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
