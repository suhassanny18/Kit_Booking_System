import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Booking } from '../../domain/entities/Booking';
import { StatusBadge, TierBadge } from '../components/StatusBadge';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { MIN_RATING_TO_APPROVE } from '../../domain/constants';
import { useToast } from '../components/Toast';
import { BookingDetailModal } from './BookingDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  PackageOpen,
} from 'lucide-react';

interface OwnerPendingScreenProps {
  currentOwnerId: string;
}

export const OwnerPendingScreen: React.FC<OwnerPendingScreenProps> = ({ currentOwnerId }) => {
  const { showToast, showDomainError } = useToast();
  const owner = kitBookingAppInstance.getOwner(currentOwnerId);
  const pendingBookings = kitBookingAppInstance.pendingForOwner(currentOwnerId);

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [counterBookingId, setCounterBookingId] = useState<string | null>(null);
  const [counterPriceRupees, setCounterPriceRupees] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = (booking: Booking) => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.ownerApprove(booking.id, currentOwnerId);
      showToast('success', `Booking ${booking.id} approved at agreed price ${formatRupees(booking.agreedPrice)}!`, 'Approved');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = (booking: Booking) => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.ownerReject(booking.id, currentOwnerId);
      showToast('info', `Booking ${booking.id} rejected. Advance handled per forfeit policy.`, 'Rejected');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCounter = (bookingId: string) => {
    const rupees = parseFloat(counterPriceRupees);
    if (isNaN(rupees) || rupees <= 0) {
      showToast('error', 'Please enter a valid positive counter offer');
      return;
    }
    setSubmitting(true);
    try {
      kitBookingAppInstance.ownerCounter(bookingId, currentOwnerId, Math.round(rupees * 100));
      showToast('success', `Counter offer of ₹${rupees} sent to renter!`);
      setCounterBookingId(null);
      setCounterPriceRupees('');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-1">
            <span>RatingPriorityStrategy Active</span>
            <span>•</span>
            <span>Highest User Rating First</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Pending Booking Requests</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {pendingBookings.length} pending
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Includes both <strong className="text-white">REQUESTED</strong> and{' '}
            <strong className="text-white">NEGOTIATING</strong> states. (Approval requires min user rating {MIN_RATING_TO_APPROVE.toFixed(1)}).
          </p>
        </div>
      </motion.div>

      {/* Pending List */}
      {pendingBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center"
        >
          <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No pending requests</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All requests for your kits have been processed. Switch to "Pickup & Returns" to manage active rentals.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {pendingBookings.map((booking, index) => {
              const user = kitBookingAppInstance.getUser(booking.userId);
              const kit = kitBookingAppInstance.getKit(booking.kitId);
              const userRating = user?.rating ?? 0;
              const canApproveRating = userRating >= MIN_RATING_TO_APPROVE;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  whileHover={{ y: -3, scale: 1.005 }}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left: User & Kit info */}
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Queue #{index + 1}
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-semibold">{booking.id}</span>
                        {kit && <TierBadge tier={kit.tier} />}
                        <StatusBadge status={booking.status} size="sm" />
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{user?.name}</h3>
                        {/* Rating Badge */}
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                            canApproveRating
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                          title={
                            canApproveRating
                              ? 'Meets minimum 2.5 approval threshold'
                              : 'BELOW 2.5 threshold - Approval is blocked by ApprovalStrategy'
                          }
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>★ {userRating.toFixed(2)}</span>
                          {!canApproveRating && <span className="text-[10px] ml-1 uppercase">(Low)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-300 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{booking.slot.formatDate()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{booking.slot.formatTimeRange()}</span>
                        </div>
                      </div>

                      {/* Kit components snippet */}
                      {kit && (
                        <div className="text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 inline-block font-mono">
                          Kit: {kit.camera.displayName} + {kit.mic.displayName} + {kit.tripod.displayName}
                        </div>
                      )}
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="text-right flex flex-col justify-between items-end gap-3 min-w-[240px]">
                      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-right w-full">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono">Latest Offer:</span>
                          <MoneyDisplay paise={booking.proposedPrice} className="text-base font-bold text-white" />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                          <span className="font-mono">Advance Held (20%):</span>
                          <MoneyDisplay paise={booking.advanceAmount} className="font-mono font-semibold text-emerald-400" />
                        </div>
                      </div>

                      {/* Review & Decision buttons */}
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Full Review
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setCounterBookingId(counterBookingId === booking.id ? null : booking.id);
                            setCounterPriceRupees((booking.proposedPrice / 100).toString());
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Counter
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          disabled={submitting}
                          onClick={() => handleReject(booking)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reject
                        </motion.button>

                        {/* Approve Button */}
                        <motion.button
                          whileHover={canApproveRating ? { scale: 1.04 } : {}}
                          whileTap={canApproveRating ? { scale: 0.96 } : {}}
                          disabled={!canApproveRating || submitting}
                          onClick={() => handleApprove(booking)}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm ${
                            canApproveRating
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-75'
                          }`}
                          title={
                            canApproveRating
                              ? 'Approve booking and lock agreed price'
                              : `Approval disabled: User rating (${userRating.toFixed(2)}) is below required 2.5`
                          }
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </motion.button>
                      </div>

                      {!canApproveRating && (
                        <div className="text-[10px] text-rose-400 font-mono text-right flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          <span>Rating below 2.5 (RatingThresholdApproval policy)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Counter Box */}
                  <AnimatePresence>
                    {counterBookingId === booking.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2"
                      >
                        <span className="text-xs text-slate-400 font-mono">Owner Counter (₹):</span>
                        <input
                          type="number"
                          min="1"
                          value={counterPriceRupees}
                          onChange={(e) => setCounterPriceRupees(e.target.value)}
                          className="w-32 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                          placeholder="Amount in ₹"
                        />
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          disabled={submitting || !counterPriceRupees}
                          onClick={() => handleSendCounter(booking.id)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Send Counter
                        </motion.button>
                        <button
                          onClick={() => setCounterBookingId(null)}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selectedBookingId && (
          <BookingDetailModal
            bookingId={selectedBookingId}
            currentActorId={currentOwnerId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
