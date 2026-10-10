import React, { useState, useMemo } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Kit } from '../../domain/entities/Kit';
import { Slot } from '../../domain/entities/Slot';
import { SlotAvailability } from '../../services/SlotService';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { TierBadge } from '../components/StatusBadge';
import { ADVANCE_PCT, MIN_RATING_TO_BOOK } from '../../domain/constants';
import { useToast } from '../components/Toast';
import { DomainError } from '../../domain/errors';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface RequestBookingModalProps {
  kit: Kit;
  currentUserId: string;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

export const RequestBookingModal: React.FC<RequestBookingModalProps> = ({
  kit,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const { showToast, showDomainError } = useToast();
  const user = kitBookingAppInstance.getUser(currentUserId);
  const clockNow = kitBookingAppInstance.getClockTime();

  // Next 7 days
  const next7Days = useMemo(() => {
    const list: Date[] = [];
    const base = new Date(clockNow.getFullYear(), clockNow.getMonth(), clockNow.getDate());
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, [clockNow]);

  const [selectedDate, setSelectedDate] = useState<Date>(next7Days[0]);
  const [selectedSlotAvail, setSelectedSlotAvail] = useState<SlotAvailability | null>(null);

  // Available slots for selected date
  const slots = useMemo(() => {
    return kitBookingAppInstance.slotsForKit(kit.id, selectedDate);
  }, [kit.id, selectedDate]);

  const activeSuggestedPaise = useMemo(() => {
    if (!selectedSlotAvail) return kit.dailyPrice;
    return kitBookingAppInstance.suggestedPrice(kit.id, selectedSlotAvail.slot);
  }, [kit, selectedSlotAvail]);

  const [proposedPriceRupees, setProposedPriceRupees] = useState<string>(
    (activeSuggestedPaise / 100).toString()
  );

  const handleSelectSlot = (avail: SlotAvailability) => {
    setSelectedSlotAvail(avail);
    const suggested = kitBookingAppInstance.suggestedPrice(kit.id, avail.slot);
    setProposedPriceRupees((suggested / 100).toString());
  };

  const proposedPricePaise = useMemo(() => {
    const num = parseFloat(proposedPriceRupees);
    if (isNaN(num) || num <= 0) return 0;
    return Math.round(num * 100);
  }, [proposedPriceRupees]);

  const advancePaise = Math.round(proposedPricePaise * ADVANCE_PCT);
  const userWallet = user?.wallet ?? 0;
  const hasEnoughForAdvance = userWallet >= advancePaise;
  const userRating = user?.rating ?? 0;

  const [submitting, setSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ step?: string; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotAvail) {
      setErrorDetails({ message: 'Please select an available time slot.' });
      return;
    }
    if (proposedPricePaise <= 0) {
      setErrorDetails({ message: 'Proposed price must be greater than zero.' });
      return;
    }

    setSubmitting(true);
    setErrorDetails(null);

    try {
      const booking = kitBookingAppInstance.book(
        currentUserId,
        kit.id,
        selectedSlotAvail.slot,
        proposedPricePaise
      );
      showToast(
        'success',
        `Booking ${booking.id} created! 20% advance (${formatRupees(advancePaise)}) locked in escrow.`,
        'Booking Request Submitted'
      );
      onSuccess(booking.id);
    } catch (err: any) {
      if (err instanceof DomainError) {
        let step = 'Pre-booking check';
        if (err.code === 'SLOT_CAPACITY_EXCEEDED') step = 'Step 1: Slot Capacity Check';
        else if (err.code === 'COOLDOWN_ACTIVE') step = 'Step 2: 20-min Rebook Cooldown';
        else if (err.code === 'INSUFFICIENT_FUNDS_FOR_ADVANCE') step = 'Step 3: 20% Advance Funds';
        else if (err.code === 'RATING_BELOW_BOOKING_THRESHOLD') step = 'Step 4: User Rating Threshold (1.0)';

        setErrorDetails({ step, message: err.message });
      } else {
        setErrorDetails({ message: err?.message || String(err) });
      }
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
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TierBadge tier={kit.tier} />
                <span className="text-xs font-mono text-slate-400">{kit.id}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Book {kit.tier} Production Package
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Date Pills */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-bold">
              1. Choose Rental Date
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {next7Days.map((d) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                const isToday = d.toDateString() === clockNow.toDateString();
                return (
                  <motion.button
                    key={d.toISOString()}
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlotAvail(null);
                    }}
                    className={`flex flex-col items-center px-3.5 py-2.5 rounded-2xl border text-xs min-w-[80px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-mono">
                      {isToday ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-black mt-0.5">{d.getDate()}</span>
                    <span className="text-[9px] text-slate-400">
                      {d.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                2. Select Time Window
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Slot capacity: {kit.totalQuantity} unit(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {slots.map((avail) => {
                const isSelected = selectedSlotAvail?.slotDefinitionId === avail.slotDefinitionId;
                const isAvailable = avail.isAvailable;

                return (
                  <motion.button
                    key={avail.slotDefinitionId}
                    type="button"
                    disabled={!isAvailable}
                    whileHover={isAvailable ? { scale: 1.02 } : {}}
                    whileTap={isAvailable ? { scale: 0.98 } : {}}
                    onClick={() => handleSelectSlot(avail)}
                    className={`p-4 rounded-2xl border text-left transition-colors relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-xl ring-2 ring-amber-500/50'
                        : isAvailable
                        ? 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200 cursor-pointer'
                        : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-sm text-white">{avail.label}</span>
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                            {avail.availableQuantity} free
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 font-bold">
                            Full
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {avail.consumedQuantity}/{avail.totalQuantity} reserved
                      </div>
                    </div>

                    {!isAvailable && (
                      <div className="mt-2 text-[10px] text-rose-400 font-medium">
                        {avail.disabledReason}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Financials & 20% Advance Calculation */}
          {selectedSlotAvail && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-mono uppercase block">
                    Suggested Rate
                  </span>
                  <MoneyDisplay paise={activeSuggestedPaise} className="text-xl font-black text-white" />
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-mono uppercase block">
                    Your Wallet
                  </span>
                  <MoneyDisplay paise={userWallet} className="text-lg font-bold text-emerald-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Your Offer Proposal (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={proposedPriceRupees}
                    onChange={(e) => setProposedPriceRupees(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* Advance escrow card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>20% Advance Required in Escrow</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Held upon submit. Adjusted on owner approval; applied toward final settlement.
                  </p>
                </div>

                <div className="text-right">
                  <MoneyDisplay paise={advancePaise} className="text-xl font-black text-amber-300" />
                  <div className="text-[10px] font-mono text-slate-400">
                    Post-hold:{' '}
                    <span className={userWallet >= advancePaise ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatRupees(userWallet - advancePaise)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Validation Warnings */}
          {selectedSlotAvail && !hasEnoughForAdvance && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Insufficient Advance Funds</strong>
                Your balance ({formatRupees(userWallet)}) is below the required 20% advance ({formatRupees(advancePaise)}). Top up in your wallet tab.
              </div>
            </div>
          )}

          {errorDetails && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-100 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                {errorDetails.step && (
                  <span className="font-mono text-[11px] font-bold text-rose-300 block mb-0.5">
                    {errorDetails.step}
                  </span>
                )}
                <span>{errorDetails.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Cancel
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={!selectedSlotAvail || proposedPricePaise <= 0 || submitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs transition-colors shadow-xl shadow-amber-500/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{submitting ? 'Validating...' : `Request with ${formatRupees(advancePaise)} Advance`}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
