import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Booking } from '../../domain/entities/Booking';
import { StatusBadge, TierBadge, ConditionBadge } from '../components/StatusBadge';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { BookingStatus, ReturnCondition } from '../../domain/enums';
import { useToast } from '../components/Toast';
import { BookingDetailModal } from './BookingDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackageCheck,
  Undo2,
  Star,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Mic,
  Disc3,
  Wrench,
  FastForward,
  Sparkles,
} from 'lucide-react';

interface OwnerHandoffScreenProps {
  currentOwnerId: string;
}

export const OwnerHandoffScreen: React.FC<OwnerHandoffScreenProps> = ({ currentOwnerId }) => {
  const { showToast, showDomainError } = useToast();
  const allBookings = kitBookingAppInstance.bookingsForOwner(currentOwnerId);
  const clockNow = kitBookingAppInstance.getClockTime();

  // Filter into active operational states: APPROVED, PICKED_UP, RETURNED, and recent COMPLETED
  const activeBookings = allBookings.filter(
    (b) =>
      b.status === BookingStatus.APPROVED ||
      b.status === BookingStatus.PICKED_UP ||
      b.status === BookingStatus.RETURNED ||
      b.status === BookingStatus.COMPLETED
  );

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Return condition selection
  const [returnConditions, setReturnConditions] = useState<Record<string, ReturnCondition>>({});

  // Inspection Checklist items per booking
  const [inspectedItems, setInspectedItems] = useState<Record<string, { camera: boolean; mic: boolean; tripod: boolean }>>({});

  // Rate user form state
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  const [submitting, setSubmitting] = useState(false);

  const toggleInspection = (bookingId: string, item: 'camera' | 'mic' | 'tripod') => {
    setInspectedItems((prev) => {
      const current = prev[bookingId] || { camera: true, mic: true, tripod: true };
      return {
        ...prev,
        [bookingId]: { ...current, [item]: !current[item] },
      };
    });
  };

  // Actions
  const handlePickup = (booking: Booking) => {
    setSubmitting(true);
    try {
      kitBookingAppInstance.pickup(booking.id, currentOwnerId);
      showToast('success', `Equipment handed off to renter. Status: PICKED_UP.`, 'Gear Picked Up');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = (booking: Booking) => {
    const condition = returnConditions[booking.id] || ReturnCondition.GOOD;
    setSubmitting(true);
    try {
      kitBookingAppInstance.returnKit(booking.id, currentOwnerId, condition);
      showToast(
        'success',
        `Gear returned in ${condition} condition. Settle complete. Kit entered 20-min turnaround inspection cooldown.`,
        'Kit Returned & Settle Done'
      );
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRateUser = (booking: Booking) => {
    const rawRating = userRatings[booking.id] ?? 4.5;
    const condition = returnConditions[booking.id] || booking.returnCondition || ReturnCondition.GOOD;
    setSubmitting(true);
    try {
      const adjusted = kitBookingAppInstance.rateUser(booking.id, currentOwnerId, rawRating, condition);
      showToast(
        'success',
        `Turnaround complete! User rated (Raw: ${rawRating.toFixed(1)}, Adjusted: ${adjusted.toFixed(2)} based on ${condition} condition). Status: COMPLETED.`,
        'Turnaround Finalized'
      );
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getAdjustedPreview = (raw: number, condition: ReturnCondition): number => {
    switch (condition) {
      case ReturnCondition.PRISTINE:
        return Math.min(5.0, raw + 0.5);
      case ReturnCondition.GOOD:
        return raw;
      case ReturnCondition.FAIR:
        return Math.max(0.0, raw - 0.5);
      case ReturnCondition.DAMAGED:
        return 1.0;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-medium mb-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>Inspection & Turnaround Cooldown Depot</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>Handoffs, Gear Returns & Maintenance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Human-centered gear workflow: Verify kit health upon return, observe the 20-minute turnaround inspection window, grade physical condition, and finalize ratings.
          </p>
        </div>
      </motion.div>

      {activeBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center"
        >
          <PackageCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No active operational handoffs</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When you approve rental requests, they appear here ready for customer pickup, return inspection, and settlement.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {activeBookings.map((booking, idx) => {
              const user = kitBookingAppInstance.getUser(booking.userId);
              const kit = kitBookingAppInstance.getKit(booking.kitId);
              const currentCondition = returnConditions[booking.id] || ReturnCondition.GOOD;
              const currentRawRating = userRatings[booking.id] ?? 4.5;
              const adjustedRatingPreview = booking.returnCondition
                ? getAdjustedPreview(currentRawRating, booking.returnCondition)
                : currentRawRating;

              const checklist = inspectedItems[booking.id] || { camera: true, mic: true, tripod: true };

              // Check if kit is under inspection cooldown
              const cooldownUntil = booking.inspectionCooldownUntil;
              const isCooldownActive = cooldownUntil ? cooldownUntil.getTime() > clockNow.getTime() : false;
              const remainingCooldownMin = cooldownUntil
                ? Math.max(0, Math.ceil((cooldownUntil.getTime() - clockNow.getTime()) / (60 * 1000)))
                : 0;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 transition-all"
                >
                  {/* Top Details Line */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400 font-bold">{booking.id}</span>
                        {kit && <TierBadge tier={kit.tier} />}
                        <StatusBadge status={booking.status} />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Renter: <span className="text-amber-400">{user?.name}</span> (Rating: ★{' '}
                        {user?.rating.toFixed(2)}) • {booking.slot.formatDisplay()}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Agreed Fee</span>
                        <MoneyDisplay paise={booking.agreedPrice} className="text-white font-bold" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Advance Held</span>
                        <MoneyDisplay paise={booking.advanceAmount} className="text-emerald-400 font-bold" />
                      </div>
                    </div>
                  </div>

                  {/* State-Specific Action Modules */}

                  {/* 1. APPROVED -> PICKUP */}
                  {booking.status === BookingStatus.APPROVED && (
                    <div className="bg-indigo-950/30 border border-indigo-500/30 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                          <PackageCheck className="w-4 h-4 text-indigo-400" />
                          <span>Ready for Customer Pickup</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Customer has booked the {kit?.tier} package. Hand over the camera, mic, and tripod case and confirm pickup.
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        disabled={submitting}
                        onClick={() => handlePickup(booking)}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
                      >
                        Confirm Equipment Pickup
                      </motion.button>
                    </div>
                  )}

                  {/* 2. PICKED_UP -> RETURN & INSPECTION */}
                  {booking.status === BookingStatus.PICKED_UP && (
                    <div className="bg-teal-950/30 border border-teal-500/30 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-teal-300 flex items-center gap-2">
                          <Undo2 className="w-4 h-4 text-teal-400" />
                          <span>Equipment Check-In & Physical Inspection</span>
                        </div>
                        <span className="text-xs font-mono text-slate-300">
                          Remaining Settlement to Charge:{' '}
                          <MoneyDisplay paise={booking.agreedPrice - booking.advanceAmount} className="text-amber-300 font-bold ml-1" />
                        </span>
                      </div>

                      {/* Inspection Checklist for Human Common Sense */}
                      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                          Equipment Return Checklist (Owner Inspection)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleInspection(booking.id, 'camera')}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checklist.camera}
                              onChange={() => {}}
                              className="accent-teal-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">Camera Check</span>
                              <span className="text-[10px] text-slate-400">Sensor & lens scratch-free</span>
                            </div>
                          </motion.label>

                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleInspection(booking.id, 'mic')}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checklist.mic}
                              onChange={() => {}}
                              className="accent-teal-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">Microphone Check</span>
                              <span className="text-[10px] text-slate-400">Wireless audio test clear</span>
                            </div>
                          </motion.label>

                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleInspection(booking.id, 'tripod')}
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checklist.tripod}
                              onChange={() => {}}
                              className="accent-teal-500 w-4 h-4 rounded cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">Tripod Check</span>
                              <span className="text-[10px] text-slate-400">Fluid head & leg locks solid</span>
                            </div>
                          </motion.label>
                        </div>
                      </div>

                      {/* Condition Assessment Selector */}
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-2">
                          Assessed Return Condition:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { cond: ReturnCondition.PRISTINE, desc: '+0.5 Rating Bonus (Max 5.0)' },
                            { cond: ReturnCondition.GOOD, desc: 'Normal Clean Condition (Unchanged)' },
                            { cond: ReturnCondition.FAIR, desc: 'Minor Dirt/Scuffs (-0.5 Rating Penalty)' },
                            { cond: ReturnCondition.DAMAGED, desc: 'Damage Detected (Fixed 1.0 Rating)' },
                          ].map((c) => (
                            <motion.button
                              key={c.cond}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() =>
                                setReturnConditions((prev) => ({ ...prev, [booking.id]: c.cond }))
                              }
                              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                                currentCondition === c.cond
                                  ? 'bg-teal-500/20 border-teal-400 text-white ring-1 ring-teal-500'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-mono text-xs font-bold block">{c.cond}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{c.desc}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-teal-500/20">
                        <p className="text-[11px] text-slate-400 font-mono">
                          Pre-checks customer funds and triggers 20-min maintenance turnaround buffer.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          disabled={submitting}
                          onClick={() => handleReturn(booking)}
                          className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
                        >
                          Accept Return & Settle Funds
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* 3. RETURNED -> TURNAROUND COOLDOWN & RATING */}
                  {booking.status === BookingStatus.RETURNED && (
                    <div className="bg-amber-950/30 border border-amber-500/30 p-5 rounded-2xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span>Owner Turnaround & Inspection Cooldown Active</span>
                        </div>
                        {booking.returnCondition && <ConditionBadge condition={booking.returnCondition} />}
                      </div>

                      {/* Turnaround Cooldown Box */}
                      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5 text-amber-400" />
                            <span>Turnaround Inspection Window (20 Minutes)</span>
                            {isCooldownActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                                {remainingCooldownMin}m remaining
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                                Inspection window satisfied
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Owner inspects CMOS sensor, sanitizes lenses, verifies mic battery levels, and tests tripod locks before releasing gear for future bookings.
                          </p>
                        </div>

                        {/* Quick demo clock forward buttons */}
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="text-[10px] text-slate-500">Fast-forward:</span>
                          <motion.button
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => kitBookingAppInstance.advanceClock(5)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            +5m
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => kitBookingAppInstance.advanceClock(20)}
                            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                          >
                            +20m (Pass Cooldown)
                          </motion.button>
                        </div>
                      </div>

                      {/* Rating Slider & Live Condition Adjustment */}
                      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold">
                            Grade Renter Experience (0.0 to 5.0):
                          </span>
                          <div className="font-mono text-amber-400 font-bold">
                            Raw Score: {currentRawRating.toFixed(1)} / 5.0
                          </div>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={currentRawRating}
                          onChange={(e) =>
                            setUserRatings((prev) => ({
                              ...prev,
                              [booking.id]: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full accent-amber-500 cursor-pointer"
                        />

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="text-[11px] text-slate-400 font-mono">
                            Adjustment for <strong className="text-white">{booking.returnCondition}</strong>:
                            {booking.returnCondition === ReturnCondition.PRISTINE && ' +0.5 bonus (cap 5.0)'}
                            {booking.returnCondition === ReturnCondition.GOOD && ' unchanged'}
                            {booking.returnCondition === ReturnCondition.FAIR && ' -0.5 penalty'}
                            {booking.returnCondition === ReturnCondition.DAMAGED && ' fixed 1.0'}
                          </div>

                          <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 font-mono">
                            <span className="text-[10px] text-slate-400 block uppercase">Final Rating</span>
                            <span className="text-emerald-400 font-black text-sm">★ {adjustedRatingPreview.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <p className="text-[11px] text-slate-400 font-mono">
                          Applies adjusted score to customer profile and completes booking atomically.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          disabled={submitting}
                          onClick={() => handleRateUser(booking)}
                          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                        >
                          Finalize Inspection & Complete
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* 4. COMPLETED */}
                  {booking.status === BookingStatus.COMPLETED && (
                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Rental lifecycle completed. Gear verified, cleaned & restocked in inventory!</span>
                      </div>
                      <button
                        onClick={() => setSelectedBookingId(booking.id)}
                        className="text-slate-400 hover:text-white underline font-mono text-[11px] cursor-pointer"
                      >
                        Audit & Ledger Breakdown
                      </button>
                    </div>
                  )}
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
