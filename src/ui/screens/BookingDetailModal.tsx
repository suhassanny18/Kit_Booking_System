import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Booking } from '../../domain/entities/Booking';
import { StatusBadge, TierBadge, ConditionBadge } from '../components/StatusBadge';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { StateTimeline } from '../components/StateTimeline';
import { BookingStatus, ActorType } from '../../domain/enums';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  ArrowRight,
  CheckCircle,
  Ban,
  Receipt,
  User as UserIcon,
  Store,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Send,
  Calendar,
} from 'lucide-react';

interface BookingDetailModalProps {
  bookingId: string;
  currentActorId: string;
  onClose: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  currentActorId,
  onClose,
}) => {
  const { showToast, showDomainError } = useToast();
  const booking = kitBookingAppInstance.getBooking(bookingId);
  const kit = kitBookingAppInstance.getKit(booking.kitId);
  const user = kitBookingAppInstance.getUser(booking.userId);
  const owner = kitBookingAppInstance.getOwner(booking.ownerId);
  const ledgerEntries = kitBookingAppInstance.ledgerFor(booking.id);

  const isUserActor = currentActorId === booking.userId;
  const isOwnerActor = currentActorId === booking.ownerId;

  const [counterInputRupees, setCounterInputRupees] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Turn checks
  const canUserCounter =
    isUserActor &&
    (booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING) &&
    booking.lastOfferedBy === ActorType.OWNER;

  const canUserAccept =
    isUserActor &&
    (booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING) &&
    booking.lastOfferedBy === ActorType.OWNER;

  const canOwnerCounter =
    isOwnerActor &&
    (booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING) &&
    booking.lastOfferedBy === ActorType.USER;

  const canOwnerAccept =
    isOwnerActor &&
    (booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING) &&
    booking.lastOfferedBy === ActorType.USER;

  const canCancel =
    (isUserActor || isOwnerActor) &&
    (booking.status === BookingStatus.REQUESTED ||
      booking.status === BookingStatus.NEGOTIATING ||
      booking.status === BookingStatus.APPROVED);

  const handleUserCounter = () => {
    const rupees = parseFloat(counterInputRupees);
    if (isNaN(rupees) || rupees <= 0) {
      showToast('error', 'Please enter a positive amount');
      return;
    }
    setSubmitting(true);
    try {
      kitBookingAppInstance.userCounter(booking.id, currentActorId, Math.round(rupees * 100));
      showToast('success', `Counter offer of ₹${rupees} sent!`);
      setCounterInputRupees('');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserAccept = () => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.userAccept(booking.id, currentActorId);
      showToast('success', "Accepted owner's offer! Awaiting final owner approval.");
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerCounter = () => {
    const rupees = parseFloat(counterInputRupees);
    if (isNaN(rupees) || rupees <= 0) {
      showToast('error', 'Please enter a positive amount');
      return;
    }
    setSubmitting(true);
    try {
      kitBookingAppInstance.ownerCounter(booking.id, currentActorId, Math.round(rupees * 100));
      showToast('success', `Owner counter offer of ₹${rupees} sent!`);
      setCounterInputRupees('');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerAccept = () => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.ownerAccept(booking.id, currentActorId);
      showToast('success', "Accepted user's offer! You can now approve the booking.");
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.cancel(booking.id, currentActorId);
      showToast('info', 'Booking cancelled and capacity released.', 'Cancelled');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenterReturn = () => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.renterReturnKit(booking.id, currentActorId);
      showToast('success', 'Equipment handed back! Studio owner is now inspecting gear.', 'Gear Returned');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOwnerPickup = () => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.pickup(booking.id, currentActorId);
      showToast('success', 'Gear marked as picked up by renter!', 'Equipment Picked Up');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400 font-bold">{booking.id}</span>
              {kit && <TierBadge tier={kit.tier} />}
              <StatusBadge status={booking.status} size="sm" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{kit ? `${kit.tier} Kit` : 'Rental Gear'}</span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono font-normal text-slate-300">
                {booking.slot.formatDisplay()}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Lifecycle State Machine Timeline */}
          <StateTimeline currentStatus={booking.status} />

          {/* Pricing & Escrow Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Latest Offer</span>
              <MoneyDisplay paise={booking.agreedPrice} className="text-lg font-black text-white" />
              <span className="text-[10px] text-slate-400 font-mono">
                By {booking.lastOfferedBy}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">20% Advance</span>
              <MoneyDisplay paise={booking.advanceAmount} className="text-lg font-black text-amber-400" />
              <span className="text-[10px] text-emerald-400 font-mono">Escrow Secured</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Renter</span>
              <span className="text-sm font-bold text-slate-200 block truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">Rating: ★ {user?.rating.toFixed(2)}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Studio Owner</span>
              <span className="text-sm font-bold text-slate-200 block truncate">{owner?.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">Equipment Owner</span>
            </div>
          </div>

          {/* Negotiation Thread */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Negotiation Offer History</span>
            </h3>

            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto">
              {booking.offerHistory.map((offer, idx) => {
                const isUser = offer.author === ActorType.USER;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      isUser
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                        : 'bg-indigo-500/5 border-indigo-500/20 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800">
                        #{idx + 1}
                      </span>
                      <span className="font-bold">
                        {isUser ? `${user?.name} (Renter)` : `${owner?.name} (Studio)`}
                      </span>
                      {offer.accepted && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Accepted
                        </span>
                      )}
                    </div>
                    <MoneyDisplay paise={offer.amount} className="text-sm font-black text-white" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              State Actions ({booking.status})
            </span>

            {/* Renter controls */}
            {isUserActor && (
              <div>
                {canUserCounter ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={counterInputRupees}
                        onChange={(e) => setCounterInputRupees(e.target.value)}
                        placeholder="Counter offer amount (₹)"
                        className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={submitting || !counterInputRupees}
                      onClick={handleUserCounter}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Send Counter
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={submitting}
                      onClick={handleUserAccept}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Accept Owner Offer
                    </motion.button>
                  </div>
                ) : booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING ? (
                  <div className="text-xs text-slate-400 font-mono italic">
                    Waiting for Studio Owner to review and respond to your offer of {formatRupees(booking.proposedPrice)}...
                  </div>
                ) : null}
              </div>
            )}

            {/* Owner controls */}
            {isOwnerActor && (
              <div>
                {canOwnerCounter ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={counterInputRupees}
                        onChange={(e) => setCounterInputRupees(e.target.value)}
                        placeholder="Owner counter amount (₹)"
                        className="w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={submitting || !counterInputRupees}
                      onClick={handleOwnerCounter}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Counter
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={submitting}
                      onClick={handleOwnerAccept}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Accept User Offer
                    </motion.button>
                  </div>
                ) : booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.NEGOTIATING ? (
                  <div className="text-xs text-slate-400 font-mono italic">
                    Waiting for renter response on your proposal...
                  </div>
                ) : null}
              </div>
            )}

            {/* Renter Return Action when in PICKED_UP */}
            {isUserActor && booking.status === BookingStatus.PICKED_UP && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-amber-300">Finished your production shoot?</div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Hand back gear to start the owner's 20-minute turnaround inspection buffer.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={submitting}
                  onClick={handleRenterReturn}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer"
                >
                  Hand Back Gear
                </motion.button>
              </div>
            )}

            {/* Owner Pickup Action when in APPROVED */}
            {isOwnerActor && booking.status === BookingStatus.APPROVED && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-indigo-300">Renter arrived for equipment pickup?</div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Hand over the camera, mic, and tripod kit case and mark as picked up.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={submitting}
                  onClick={handleOwnerPickup}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer"
                >
                  Mark as Picked Up
                </motion.button>
              </div>
            )}

            {/* Cancellation */}
            {canCancel && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Cancel allowed from REQUESTED, NEGOTIATING, APPROVED
                </span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={submitting}
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel Booking
                </motion.button>
              </div>
            )}
          </div>

          {/* Ledger Breakdown */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 mb-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Financial Ledger Entries ({ledgerEntries.length})</span>
            </h3>

            {ledgerEntries.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                No ledger transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto">
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            entry.account === 'USER'
                              ? 'bg-blue-500/20 text-blue-300'
                              : entry.account === 'OWNER'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {entry.account}
                        </span>
                        <span className="text-slate-200 font-medium">{entry.reason}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <MoneyDisplay paise={entry.amount} showSign className="text-xs font-bold" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
