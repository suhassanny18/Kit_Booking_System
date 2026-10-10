import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Booking } from '../../domain/entities/Booking';
import { StatusBadge, TierBadge, ConditionBadge } from '../components/StatusBadge';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { BookingDetailModal } from './BookingDetailModal';
import { BookingStatus, ActorType } from '../../domain/enums';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  ArrowRight,
  PackageOpen,
  Undo2,
  Wrench,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface MyBookingsScreenProps {
  currentUserId: string;
}

export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({ currentUserId }) => {
  const { showToast, showDomainError } = useToast();
  const bookings = kitBookingAppInstance.bookingsForUser(currentUserId);
  const user = kitBookingAppInstance.getUser(currentUserId);
  const clockNow = kitBookingAppInstance.getClockTime();

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return (
        b.status === BookingStatus.APPROVED ||
        b.status === BookingStatus.PICKED_UP ||
        b.status === BookingStatus.RETURNED
      );
    }
    if (statusFilter === 'NEGOTIATION') {
      return b.status === BookingStatus.REQUESTED || b.status === BookingStatus.NEGOTIATING;
    }
    return b.status === statusFilter;
  });

  const handleRenterReturn = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    setSubmittingId(bookingId);
    try {
      kitBookingAppInstance.renterReturnKit(bookingId, currentUserId);
      showToast(
        'success',
        'Gear handed back to studio! Owner inspection cooldown active (20 min buffer).',
        'Equipment Returned'
      );
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Filmmaker Rental Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>My Camera Kit Bookings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {bookings.length} total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-amber-400">{user?.name}</strong> • Rating: ★{' '}
            {user?.rating.toFixed(2)} ({user?.ratingCount} shoots) • Wallet: {formatRupees(user?.wallet ?? 0)}
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active & In-Use' },
            { id: 'NEGOTIATION', label: 'In Negotiation' },
            { id: BookingStatus.RETURNED, label: 'Under Inspection' },
            { id: BookingStatus.COMPLETED, label: 'Completed' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center"
        >
          <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No bookings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {statusFilter === 'ALL'
              ? 'You have not requested any cinema packages yet. Explore Kits to reserve equipment!'
              : `No bookings found matching filter: ${statusFilter}.`}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((booking, idx) => {
              const kit = kitBookingAppInstance.getKit(booking.kitId);
              const owner = kitBookingAppInstance.getOwner(booking.ownerId);

              // Cooldown metrics
              const isUnderInspection = booking.status === BookingStatus.RETURNED;
              const remainingCooldownMin = booking.inspectionCooldownUntil
                ? Math.max(0, Math.ceil((booking.inspectionCooldownUntil.getTime() - clockNow.getTime()) / (60 * 1000)))
                : 0;

              const isUserTurnToRespond =
                (booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING) &&
                booking.lastOfferedBy === ActorType.OWNER;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => setSelectedBookingId(booking.id)}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl cursor-pointer transition-all hover:shadow-2xl hover:shadow-black/50 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Top Bar with ID and Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] text-slate-400 font-semibold">{booking.id}</span>
                          {kit && <TierBadge tier={kit.tier} />}
                        </div>
                        <h4 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                          {kit?.tier} Kit Package
                        </h4>
                        <p className="text-xs text-slate-400">
                          Studio: <span className="text-slate-300 font-medium">{owner?.name || booking.ownerId}</span>
                        </p>
                      </div>

                      <StatusBadge status={booking.status} />
                    </div>

                    {/* Slot Details */}
                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 my-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{booking.slot.formatDate()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{booking.slot.formatTimeRange()}</span>
                      </div>
                    </div>

                    {/* Financials Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                          Agreed / Proposed
                        </span>
                        <MoneyDisplay paise={booking.agreedPrice} className="font-bold text-white text-sm" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                          20% Escrow Advance
                        </span>
                        <MoneyDisplay paise={booking.advanceAmount} className="font-bold text-emerald-400 text-sm" />
                      </div>
                    </div>

                    {/* Special Contextual Banners */}
                    {/* Under Inspection Cooldown Notice */}
                    {isUnderInspection && (
                      <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
                        <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-bold text-amber-300 flex items-center justify-between">
                            <span>Owner Inspection Cooldown</span>
                            {remainingCooldownMin > 0 && (
                              <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
                                {remainingCooldownMin}m left
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            Gear handed back. Owner is inspecting the camera sensor, mic frequencies, and tripod.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Negotiation Turn Notice */}
                    {isUserTurnToRespond && (
                      <div className="mt-3 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Owner Countered: {formatRupees(booking.proposedPrice)}</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Your Turn</span>
                      </div>
                    )}

                    {/* Completed with Condition Badge */}
                    {booking.status === BookingStatus.COMPLETED && booking.returnCondition && (
                      <div className="mt-3 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">Inspected Condition:</span>
                        <ConditionBadge condition={booking.returnCondition} />
                      </div>
                    )}
                  </div>

                  {/* Card Actions & Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    {/* Renter Return Button when PICKED_UP */}
                    {booking.status === BookingStatus.PICKED_UP && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={submittingId === booking.id}
                        onClick={(e) => handleRenterReturn(e, booking.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Undo2 className="w-4 h-4" />
                        <span>Hand Back Gear (Return to Studio)</span>
                      </motion.button>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-amber-400 transition-colors">
                      <span className="font-mono text-[11px]">
                        {booking.offerHistory.length} offer(s) • Click for full details
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Selected Detail Modal */}
      <AnimatePresence>
        {selectedBookingId && (
          <BookingDetailModal
            bookingId={selectedBookingId}
            currentActorId={currentUserId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
